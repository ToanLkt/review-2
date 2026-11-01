using System.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SmartFarm.Repositories.Data;
using SmartFarm.Repositories.Entities;

namespace SmartFarm.Repositories;

public interface IRepository<T> where T : class
{
    IQueryable<T> Query(bool tracking = true);
    ValueTask<T?> FindAsync(params object[] keys);
    void Add(T entity);
    void AddRange(IEnumerable<T> entities);
}

public interface IUnitOfWork
{
    IRepository<User> Users { get; }
    IRepository<RefreshToken> RefreshTokens { get; }
    IRepository<FarmZone> FarmZones { get; }
    IRepository<SoilTray> SoilTrays { get; }
    IRepository<Supply> Supplies { get; }
    IRepository<Order> Orders { get; }
    IRepository<FarmConfig> FarmConfigs { get; }
    Task<List<SoilTray>> LockAvailableTraysAsync(int quantity, int? farmAreaId);
    Task<IDbContextTransaction?> BeginSerializableTransactionAsync();
    Task<int> SaveChangesAsync();
}

internal sealed class Repository<T>(AppDbContext db) : IRepository<T> where T : class
{
    public IQueryable<T> Query(bool tracking = true) => tracking ? db.Set<T>() : db.Set<T>().AsNoTracking();
    public ValueTask<T?> FindAsync(params object[] keys) => db.Set<T>().FindAsync(keys);
    public void Add(T entity) => db.Set<T>().Add(entity);
    public void AddRange(IEnumerable<T> entities) => db.Set<T>().AddRange(entities);
}

public sealed class UnitOfWork(AppDbContext db) : IUnitOfWork
{
    public IRepository<User> Users { get; } = new Repository<User>(db);
    public IRepository<RefreshToken> RefreshTokens { get; } = new Repository<RefreshToken>(db);
    public IRepository<FarmZone> FarmZones { get; } = new Repository<FarmZone>(db);
    public IRepository<SoilTray> SoilTrays { get; } = new Repository<SoilTray>(db);
    public IRepository<Supply> Supplies { get; } = new Repository<Supply>(db);
    public IRepository<Order> Orders { get; } = new Repository<Order>(db);
    public IRepository<FarmConfig> FarmConfigs { get; } = new Repository<FarmConfig>(db);

    public async Task<IDbContextTransaction?> BeginSerializableTransactionAsync() =>
        !db.Database.IsRelational()
            ? null
            : await db.Database.BeginTransactionAsync(IsolationLevel.Serializable);

    public Task<List<SoilTray>> LockAvailableTraysAsync(int quantity, int? farmAreaId)
    {
        if (!db.Database.IsRelational())
        {
            var q = db.SoilTrays.Include(x => x.Rack).Where(st => st.CurrentStatus == TrayStatus.Available);
            if (farmAreaId.HasValue)
                q = q.Where(st => st.Rack!.ZoneId == farmAreaId.Value);
            return q.OrderBy(st => st.SoilTrayId).Take(quantity).ToListAsync();
        }
        if (farmAreaId.HasValue)
            return db.SoilTrays.FromSqlRaw(
                "SELECT st.* FROM SoilTrays st JOIN FarmRacks fr ON fr.RackId=st.RackId WHERE st.CurrentStatus={0} AND fr.ZoneId={1} ORDER BY st.SoilTrayId LIMIT {2} FOR UPDATE",
                TrayStatus.Available, farmAreaId.Value, quantity).ToListAsync();
        return db.SoilTrays.FromSqlRaw(
            "SELECT * FROM SoilTrays WHERE CurrentStatus = {0} ORDER BY SoilTrayId LIMIT {1} FOR UPDATE",
            TrayStatus.Available, quantity).ToListAsync();
    }

    public Task<int> SaveChangesAsync() => db.SaveChangesAsync();
}
