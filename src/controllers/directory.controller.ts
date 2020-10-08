import {Count, CountSchema, repository, Where} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {SecurityBindings, UserProfile} from '@loopback/security';
import {v1 as uuidv1} from 'uuid';
import {intercept, inject} from '@loopback/context';
import {ERR_STRS} from '../interceptors/error-mapping';
import {TransformErrorInterceptor} from '../interceptors';
import {authenticate} from '@loopback/authentication';
import {Directory, PostDirectory, DirectoryCollectionResponse} from '../models';
import {DirectoryRepository} from '../repositories';

const BASE_URL = 'https://api.collection.designassets.cimpress.io/v0';
const ROOT_PARENT_ID = 'ROOT';

interface CollectionbyIdsRequest {
  ids: string[];
  tenantId: string;
}

@intercept(TransformErrorInterceptor.BINDING_KEY)
export class DirectoryController {
  constructor(
    @repository(DirectoryRepository)
    public directoryRepository: DirectoryRepository,
  ) {}

  @post('/directories', {
    responses: {
      '200': {
        description: 'Directory model instance',
        content: {'application/json': {schema: getModelSchemaRef(Directory)}},
      },
    },
  })
  @authenticate('user')
  async create(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    @requestBody() directory: PostDirectory,
  ): Promise<Directory> {
    const createdAt = new Date().toISOString();
    const createdBy = currentUserProfile.sub;

    const directoryObj = {
      id: uuidv1(),
      label: directory.label,
      parentId: directory.parentId ?? ROOT_PARENT_ID,
      deleted: false,
      tenantId: directory.tenantId,
      createdBy,
      createdAt,
    };
    return this.directoryRepository.create(directoryObj);
  }

  @post('/directories/collectionNamesRequest', {
    responses: {
      '200': {
        description: 'Directory model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(DirectoryCollectionResponse, {
              includeRelations: true,
            }),
          },
        },
      },
    },
  })
  @authenticate('user')
  async getCollectionByIds(
    @requestBody() collectionbyIdsRequest: CollectionbyIdsRequest,
  ): Promise<unknown> {
    const flatDirectories = await this.directoryRepository.find({
      where: {
        tenantId: collectionbyIdsRequest.tenantId,
      },
    });

    const item = await Promise.all(
      flatDirectories
        .filter(directory => collectionbyIdsRequest.ids.includes(directory.id))
        .map(async directory => {
          const childrenCount = (
            await this.directoryRepository.count({
              tenantId: collectionbyIdsRequest.tenantId,
              parentId: directory.id,
            })
          ).count;

          const {
            id,
            label,
            parentId,
            deleted,
            tenantId,
            createdBy,
            createdAt,
            modifiedBy,
            modifiedAt,
          } = directory;

          return {
            id,
            label,
            parentId: parentId === ROOT_PARENT_ID ? undefined : parentId,
            deleted,
            tenantId,
            createdBy,
            createdAt,
            modifiedBy,
            modifiedAt,
            _links: {
              self: `${BASE_URL}/directories/${directory.id}?tenantId=${tenantId}`,
              ...(childrenCount > 0 && {
                children: `${BASE_URL}/directories?tenantId=${tenantId}&parentId=${directory.id}`,
              }),
            },
          };
        }),
    );

    const response = {
      _links: {
        self: `${BASE_URL}/directories?tenantId:${collectionbyIdsRequest.tenantId}`,
      },
      _embedded: {
        item,
      },
    };

    return response;
  }

  @get('/directories', {
    parameters: [
      {name: 'tenantId', schema: {type: 'string'}, in: 'query', required: true},
      {name: 'parentId', schema: {type: 'string'}, in: 'query'},
    ],
    responses: {
      '200': {
        description: 'Array of Directory model instances',
        content: {
          'application/json': {
            schema: getModelSchemaRef(DirectoryCollectionResponse, {
              includeRelations: true,
            }),
          },
        },
      },
    },
  })
  @authenticate('user')
  async find(
    @inject(SecurityBindings.USER)
    currentUserProfile: UserProfile,
    requestTenantId: string,
    requestParentId: string,
  ): Promise<unknown> {
    const flatDirectories = await this.directoryRepository.find({
      where: {
        tenantId: requestTenantId,
        parentId: requestParentId || ROOT_PARENT_ID,
      },
    });

    const item = await Promise.all(
      flatDirectories.map(async directory => {
        const childrenCount = (
          await this.directoryRepository.count({
            tenantId: requestTenantId,
            parentId: directory.id,
          })
        ).count;

        const {
          id,
          label,
          parentId,
          deleted,
          tenantId,
          createdBy,
          createdAt,
          modifiedBy,
          modifiedAt,
        } = directory;

        return {
          id,
          label,
          parentId: parentId === ROOT_PARENT_ID ? undefined : parentId,
          deleted,
          tenantId,
          createdBy,
          createdAt,
          modifiedBy,
          modifiedAt,
          _links: {
            self: `${BASE_URL}/directories/${directory.id}?tenantId=${tenantId}`,
            ...(childrenCount > 0 && {
              children: `${BASE_URL}/directories?tenantId=${tenantId}&parentId=${directory.id}`,
            }),
          },
        };
      }),
    );

    const response = {
      _links: {
        self: `${BASE_URL}/directories?tenantId:${requestTenantId}`,
      },
      _embedded: {
        item,
      },
    };

    return response;
  }

  @get('/directories/{id}', {
    responses: {
      '200': {
        description: 'Directory model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Directory, {includeRelations: true}),
          },
        },
      },
    },
  })
  @authenticate('user')
  async findById(
    @param({name: 'tenantId', in: 'query', required: true})
    tenantId: string,
    @param.path.string('id') id: string,
  ): Promise<Directory | null> {
    return this.directoryRepository.findOne({
      where: {
        id: id,
        tenantId: tenantId,
      },
    });
  }

  @patch('/directories/{id}', {
    responses: {
      '204': {
        description: 'Directory PATCH success',
      },
    },
  })
  @authenticate('user')
  async updateById(
    @param.path.number('id') id: string,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Directory, {partial: true}),
        },
      },
    })
    directory: Directory,
  ): Promise<void> {
    await this.directoryRepository.updateById(id, directory);
  }

  @put('/directories/{id}', {
    responses: {
      '204': {
        description: 'Directory PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: string,
    @requestBody() directory: Directory,
  ): Promise<void> {
    await this.directoryRepository.replaceById(id, directory);
  }

  @del('/directories/{id}', {
    responses: {
      '204': {
        description: 'Directory DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: string): Promise<void> {
    await this.directoryRepository.deleteById(id);
  }

  // Extra APIs

  @get('/directories/count', {
    responses: {
      '200': {
        description: 'Directory model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Directory))
    where?: Where<Directory>,
  ): Promise<Count> {
    return this.directoryRepository.count(where);
  }

  @patch('/directories', {
    responses: {
      '200': {
        description: 'Directory PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Directory, {partial: true}),
        },
      },
    })
    directory: Directory,
    @param.query.object('where', getWhereSchemaFor(Directory))
    where?: Where<Directory>,
  ): Promise<Count> {
    return this.directoryRepository.updateAll(directory, where);
  }

  // Mock method, actual should throw error like this
  authenticate(tenantId: string): boolean {
    if (tenantId !== 'SceneTestGroup') {
      throw new Error(ERR_STRS.UNAUTHORIZED);
    }
    return true;
  }
}
