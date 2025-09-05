// Mock createRoot
const mockRender = jest.fn();
const mockCreateRoot = jest.fn(() => ({
  render: mockRender,
}));

jest.mock('react-dom/client', () => ({
  createRoot: mockCreateRoot,
}));

// Mock App component
jest.mock('../App', () => {
  return function MockApp() {
    return 'Mocked App';
  };
});

describe('index.tsx', () => {
  let getElementByIdSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockRender.mockClear();
    mockCreateRoot.mockClear();
    
    // Ensure mockCreateRoot returns the mock object
    mockCreateRoot.mockReturnValue({
      render: mockRender,
    });

    // Mock getElementById
    const mockElement = document.createElement('div');
    mockElement.id = 'root';
    getElementByIdSpy = jest.spyOn(document, 'getElementById').mockReturnValue(mockElement);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render App component into root element', () => {
    // Import the module to trigger execution
    require('../index.tsx');

    // Verify that getElementById was called with 'root'
    expect(getElementByIdSpy).toHaveBeenCalledWith('root');

    // Verify that createRoot was called with the root element
    expect(mockCreateRoot).toHaveBeenCalledWith(expect.any(HTMLElement));

    // Verify that render was called
    expect(mockRender).toHaveBeenCalledTimes(1);
  });

});