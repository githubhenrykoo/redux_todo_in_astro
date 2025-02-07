## Plan
1. Make Dictionary Panels.json (is the one that contain panel type and component)
2. import the dictionary into PanelGroupLayout.jsx (this is for making the code simplier without import the panel directly into PanelGroupLayout.jsx, just import the library and use it)
3. Simplier the code## Plan

1. **Create `Dictionary Panels.json`:**
   - This JSON file will serve as a centralized repository for defining all panel types and their corresponding components. It will help in maintaining consistency across different parts of the application by ensuring that all panel configurations are stored in one place.
   - Steps to create:
     - Identify all panel types and their components currently used in the application.
     - Structure the JSON file to include keys for each panel type, with nested objects or arrays for their components.
     - Validate the JSON structure to ensure it is correctly formatted and easily readable.

2. **Import the Dictionary into `PanelGroupLayout.jsx`:**
   - By importing the dictionary, you can streamline the code within `PanelGroupLayout.jsx`. This approach eliminates the need to import individual panels directly, promoting a cleaner and more modular codebase.
   - Steps to implement:
     - Import the JSON dictionary at the top of the `PanelGroupLayout.jsx` file.
     - Refactor the existing code to utilize the dictionary for panel rendering, replacing direct imports with references to the dictionary.
     - Test the layout to ensure that all panels render correctly using the dictionary.
