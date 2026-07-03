# Layout Tree
```
app/layout/
├─ AppShell.jsx          // root layout, includes TopChrome + Workspace
├─ Workspace.jsx        // flex container splitting MainViewport & InspectorViewport
├─ MainViewport.jsx     // <main> area for future screens
└─ InspectorViewport.jsx // <aside> containing SelectionInspector
```

*All components are pure layout, no business logic, and use only shared objects and primitives.*
