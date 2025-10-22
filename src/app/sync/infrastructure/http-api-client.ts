import type { ApiClient } from "../domain/types";

export class HttpApiClient implements ApiClient {
  async fetchMetaJson(): Promise<{ version: number; tables: Array<[string, number]> }> {
    const response = await fetch("/init/meta.json");
    return response.json();
  }

  async fetchInitFile<T>(tableName: string, fileId: number): Promise<Array<T>> {
    const response = await fetch(`/init/${tableName}/${fileId}.json`);
    return response.json();
  }

  async oneWaySync(
    tableName: string,
    from: number,
    to: number,
    offset: number,
    limit: number
  ): Promise<Array<unknown>> {
    const params = new URLSearchParams({
      from: from.toString(),
      to: to.toString(),
      offset: offset.toString(),
      limit: limit.toString(),
    });
    const response = await fetch(`/api/sync/${tableName}?${params}`);
    return response.json();
  }

  async twoWaySync<T>(
    tableName: string,
    from: number,
    to: number,
    offset: number,
    limit: number,
    localEntries: Array<T>
  ): Promise<Array<unknown>> {
    const params = new URLSearchParams({
      from: from.toString(),
      to: to.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
    });
    
    const response = await fetch(`/api/sync/${tableName}?${params}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(localEntries),
    });
    
    return response.json();
  }

  async singleItemSync<T extends { update_time: number }>(
    tableName: string,
    localData: T | undefined
  ): Promise<T | undefined> {
    const response = await fetch(`/api/sync/${tableName}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(localData || {}),
    });
    
    if (response.status === 404 || response.status === 204) {
      return undefined;
    }
    
    const data = await response.json();
    // Server might return partial data (e.g., UserSettings only returns synced fields)
    // The table's put() method should handle merging with local data
    return data as T;
  }
}
