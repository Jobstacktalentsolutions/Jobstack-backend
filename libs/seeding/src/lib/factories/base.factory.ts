import { DeepPartial, DataSource, Repository, ObjectLiteral } from 'typeorm';

/**
 * Simple base factory for static data insertion
 */
export abstract class BaseFactory<T extends ObjectLiteral> {
  constructor(
    protected dataSource: DataSource,
    protected repository: Repository<T>,
    protected config: { defaultAttributes: () => any },
  ) {}

  /**
   * Create and save an entity
   */
  async create(data: DeepPartial<T> = {} as DeepPartial<T>): Promise<T> {
    // Merge default attributes with provided data
    const attributes = {
      ...this.config.defaultAttributes(),
      ...data,
    };

    // Create and save the entity
    const entity = this.repository.create(attributes as T);
    return await this.repository.save(entity);
  }

  /**
   * Upsert an entity (insert or update based on ID or unique fields)
   */
  async upsert(data: DeepPartial<T> & { id: string }): Promise<T> {
    // Merge default attributes with provided data
    const attributes = {
      ...this.config.defaultAttributes(),
      ...data,
    };

    // Check if entity exists by ID first
    const existingEntity = await this.repository.findOne({
      where: { id: data.id } as any,
    });

    if (existingEntity) {
      // Update existing entity
      await this.repository.update({ id: data.id } as any, attributes);
      return (await this.repository.findOne({
        where: { id: data.id } as any,
      })) as T;
    } else {
      // Create new entity
      const entity = this.repository.create(attributes as T);
      return await this.repository.save(entity);
    }
  }

  /**
   * Smart upsert that checks multiple unique fields using OR conditions
   */
  async smartUpsert(
    data: DeepPartial<T> & { id: string },
    uniqueFields: string[],
  ): Promise<T> {
    // Merge default attributes with provided data
    const attributes = {
      ...this.config.defaultAttributes(),
      ...data,
    };

    // Build OR conditions for unique fields
    const orConditions = [];

    // Always check by ID first
    orConditions.push({ id: data.id });

    // Add conditions for other unique fields if they exist in data
    for (const field of uniqueFields) {
      if (data[field] !== undefined && data[field] !== null) {
        orConditions.push({ [field]: data[field] });
      }
    }

    // Check if entity exists by any of the unique fields
    const existingEntity = await this.repository.findOne({
      where: orConditions as any,
    });

    if (existingEntity) {
      // Update existing entity
      await this.repository.update(
        { id: existingEntity.id } as any,
        attributes,
      );
      return (await this.repository.findOne({
        where: { id: existingEntity.id } as any,
      })) as T;
    } else {
      // Create new entity
      const entity = this.repository.create(attributes as T);
      return await this.repository.save(entity);
    }
  }

  /**
   * Create multiple entities
   */
  async createMany(entities: DeepPartial<T>[]): Promise<T[]> {
    const createdEntities = [];
    for (const entityData of entities) {
      const entity = await this.create(entityData);
      createdEntities.push(entity);
    }
    return createdEntities;
  }

  /**
   * Upsert multiple entities
   */
  async upsertMany(
    entities: (DeepPartial<T> & { id: string })[],
  ): Promise<T[]> {
    const upsertedEntities = [];
    for (const entityData of entities) {
      const entity = await this.upsert(entityData);
      upsertedEntities.push(entity);
    }
    return upsertedEntities;
  }

  /**
   * Create all entities (to be implemented by child classes)
   */
  async createAll(): Promise<T[]> {
    throw new Error('createAll method must be implemented by child classes');
  }
}
