namespace RetroRewindWebsite.Repositories.Common;

public interface IRepository<T> where T : class
{
    /// <summary>
    /// Asynchronously retrieves an entity by its unique identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the entity to retrieve. Must be a positive integer.</param>
    /// <returns>A task that represents the asynchronous operation. The task result contains the entity of type T if found;
    /// otherwise, null.</returns>
    Task<T?> GetByIdAsync(int id);

    /// <summary>
    /// Asynchronously adds the specified entity to the data store.
    /// </summary>
    /// <param name="entity">The entity to add. Cannot be null.</param>
    /// <returns>A task that represents the asynchronous add operation.</returns>
    Task AddAsync(T entity);

    /// <summary>
    /// Asynchronously updates the specified entity in the data store.
    /// </summary>
    /// <param name="entity">The entity to update. Cannot be null. The entity must already exist in the data store.</param>
    /// <returns>A task that represents the asynchronous update operation.</returns>
    Task UpdateAsync(T entity);

    /// <summary>
    /// Asynchronously deletes the entity with the specified identifier.
    /// </summary>
    /// <param name="id">The unique identifier of the entity to delete. Must be a valid and existing entity ID.</param>
    /// <returns>A task that represents the asynchronous delete operation.</returns>
    Task DeleteAsync(int id);
}
