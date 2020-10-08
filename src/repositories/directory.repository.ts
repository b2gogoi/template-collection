import {DefaultCrudRepository} from '@loopback/repository';
import {Directory, DirectoryRelations} from '../models';
import {DynamoDbDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class DirectoryRepository extends DefaultCrudRepository<
  Directory,
  typeof Directory.prototype.id,
  DirectoryRelations
> {
  constructor(@inject('datasources.dynamoDb') dataSource: DynamoDbDataSource) {
    super(Directory, dataSource);
  }
}
