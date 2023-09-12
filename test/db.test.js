import PromiseDB from '../src/index';
import 'fake-indexeddb/auto';

describe('UNIT:core:PromiseDB', () => {
  const db = PromiseDB.getInstance('PromiseDB');
  db.createTable('testTable', ['id', 'log', 'size', 'expires']);
  const firstData = {
    expires: 111,
    id: '1',
    log: 'test',
    size: 110,
  };
  const secondData = {
    expires: 222,
    id: '2',
    log: 'test',
    size: 220,
  };
  const updateNonExistent = {
    expires: 777,
    id: '7',
    log: 'update non-existent test',
    size: 770,
  };

  test("Add data that doesn't exist", async () => {
    const result = await db.table('testTable').add(firstData);
    expect(result).toBe('1');
  });

  test('Add existing data', async () => {
    try {
      const result = await db.table('testTable').add(firstData);
    } catch (e) {
      expect(e).toMatchObject({
        name: 'ConstraintError',
      });
    }
  });

  test('Read existing data', async () => {
    const result = await db.table('testTable').read('1');
    expect(result).toEqual(firstData);
  });

  test("Read data that doesn't exist", async () => {
    const result = await db.table('testTable').read('2');
    expect(result).toBeUndefined();
  });

  test('Get all items', async () => {
    const mockFn = jest.fn();
    const result = await db.table('testTable').add(secondData);
    await db.table('testTable').each(mockFn);
    expect(mockFn).toBeCalledTimes(2);
  });

  test('Update an existing project', async () => {
    const updateSecondData = {
      expires: 222,
      id: '2',
      log: 'update test',
      size: 220,
    };
    const resultKey = await db.table('testTable').update(updateSecondData);
    expect(resultKey).toBe('2');
    const result = await db.table('testTable').read('2');
    expect(result).toEqual(updateSecondData);
  });

  test('Update non-existent items', async () => {
    const resultKey = await db.table('testTable').update(updateNonExistent);
    expect(resultKey).toBe('7');
    const result = await db.table('testTable').read('7');
    expect(result).toEqual(updateNonExistent);
  });

  test('Delete existing data', async () => {
    const keys = ['1', '2'];
    const mockFn = jest.fn();
    const resultKeys = await db.table('testTable').remove(keys);
    expect(resultKeys).toEqual(keys);
    await db.table('testTable').each(mockFn);
    expect(mockFn).toBeCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith(updateNonExistent);
  });

  test('Delete non-existent data', async () => {
    const keys = '7';
    const resultKeys = await db.table('testTable').remove(keys);
    expect(resultKeys).toBeUndefined();
  });

  test('Delete incoming wrong keys', async () => {
    const keys = [Error(1)];
    try {
      const result = await db.table('testTable').remove(keys);
    } catch (e) {
      expect(e).toMatchObject({
        name: 'DataError',
        message: 'Data provided to an operation does not meet requirements.',
      });
    }
  });
});
