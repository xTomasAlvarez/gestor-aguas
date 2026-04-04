/* Mock of api.js for testing */

// Create a simple mock that doesn't require jest
class MockApiClient {
  constructor() {
    this.get = function() { return Promise.resolve({ data: {} }); };
    this.post = function() { return Promise.resolve({ data: {} }); };
    this.put = function() { return Promise.resolve({ data: {} }); };
    this.delete = function() { return Promise.resolve({ data: {} }); };
    this.interceptors = {
      response: {
        use: function() {},
      },
    };
  }
}

export default new MockApiClient();
