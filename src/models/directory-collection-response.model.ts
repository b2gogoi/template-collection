import {model, property, Model} from '@loopback/repository';
import {Directory} from '.';

@model()
export class Links extends Model {
  @property({
    type: 'string',
  })
  self: string;

  @property({
    type: 'string',
  })
  children: string;
}

@model()
export class Folder extends Directory {
  @property()
  _links: Links;
}

@model()
class Items extends Model {
  @property({
    type: 'array',
    itemType: Folder,
  })
  item: Folder[];
}

@model()
export class DirectoryCollectionResponse extends Model {
  @property()
  _links: Links;

  @property()
  _embedded?: Items;
}
