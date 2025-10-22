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

  async singleItemSync(
    tableName: string,
    id: string
  ): Promise<unknown | null> {
    const response = await fetch(`/api/sync/${tableName}/${id}`);
    if (response.status === 404) {
      return null;
    }
    return response.json();
  }
}
