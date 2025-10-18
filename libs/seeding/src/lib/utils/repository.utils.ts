import { DataSource, Repository, ObjectLiteral } from 'typeorm';

/**
 * Get repository by entity name
 */
export function getRepositoryByName<T extends ObjectLiteral>(
  dataSource: DataSource,
  entityName: string,
): Repository<T> {
  const metadata = dataSource.entityMetadatas.find(
    (meta) => meta.name === entityName || meta.tableName === entityName,
  );

  if (!metadata) {
    throw new Error(`Entity '${entityName}' not found in data source`);
  }

  return dataSource.getRepository(metadata.target) as Repository<T>;
}
