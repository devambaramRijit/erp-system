# Customer Management System Development Instructions
## System Overview
You are working on a Customer Management System built with React and TypeScript. The system allows users to manage customer data through a web interface with features for adding, editing, deleting, searching, importing, and exporting customer records.

## Project Structure
```
src/
├── components/
│   └── CustomerScreen.tsx
├── hooks/
│   ├── useCustomerManagement.ts
│   └── useCustomerForm.ts
├── services/
│   └── customerService.ts
├── types/
│   └── customer.ts
└── utils/
    ├── storage.ts
    └── events.ts
```

## Key Components
### CustomerScreen Component
The main component that renders the customer management interface. It includes:
- Customer list display with search functionality
- Add/Edit customer modal form
- Import/Export functionality
- Responsive design with proper loading states

### Supporting Files
- `types/customer.ts`: TypeScript interfaces for customer data and form structures
- `utils/storage.ts`: LocalStorage utility functions
- `utils/events.ts`: Custom event system for state updates
- `services/customerService.ts`: API communication functions
- `hooks/useCustomerManagement.ts`: Hook for managing customer data state
- `hooks/useCustomerForm.ts`: Hook for managing form state and operations

## Development Guidelines
### 1. Code Organization
- Follow the existing file structure
- Maintain separation of concerns (UI, state, business logic)
- Use TypeScript interfaces for all data structures
- Keep components focused on rendering only

### 2. State Management
- Use custom hooks for state management
- Implement proper loading states
- Handle errors gracefully with user feedback
- Use the custom event system for cross-component communication

### 3. API Integration
- All API calls must go through the service layer
- Implement proper error handling for API requests
- Use async/await for asynchronous operations
- Include proper loading states during API calls

### 4. UI/UX Requirements
- Maintain responsive design
- Use Ant Design components consistently
- Implement proper loading indicators
- Provide clear user feedback for all actions
- Use modals for forms and confirmations

### 5. Data Validation
- Validate form inputs before submission
- Implement proper error messages for validation failures
- Handle edge cases (empty data, network errors, etc.)

### 6. Import/Export Functionality
- Support Excel file import/export using XLSX library
- Validate imported data structure
- Provide template download for imports
- Handle import errors gracefully

## Implementation Rules
### When Adding New Features
1. Define TypeScript interfaces in `types/customer.ts`
2. Update service functions in `services/customerService.ts`
3. Create or update custom hooks if needed
4. Update the main component with UI changes
5. Test all scenarios including error cases

### When Modifying Existing Code
1. Maintain backward compatibility
2. Update related types and interfaces
3. Ensure all existing functionality remains intact
4. Test thoroughly after changes

### When Fixing Bugs
1. Identify the root cause (UI, state, API, etc.)
2. Fix at the appropriate level (component, hook, service)
3. Add proper error handling if missing
4. Test the fix in all relevant scenarios

## Common Patterns
### Form Handling
```typescript
const { formData, editingCustomer, showForm, resetForm, handleSubmit } = useCustomerForm();
```

### API Calls
```typescript
try {
  const result = await customerService.addCustomer(formData);
  // Handle success
} catch (error) {
  // Handle error
}
```

### Event System
```typescript
dispatchCustomerUpdate({
  customers: updatedCustomers,
  action: 'add' | 'update' | 'delete' | 'import'
});
```

## Testing Requirements
- Test all user interactions
- Verify error handling works correctly
- Test import/export functionality with various file formats
- Ensure responsive design works on different screen sizes
- Test search functionality with various search terms

## Performance Considerations
- Implement pagination for large datasets
- Optimize search functionality for performance
- Use React.memo for expensive components
- Implement proper cleanup in useEffect hooks

## Security Considerations
- Validate all user inputs
- Sanitize data before API calls
- Implement proper authentication for API requests
- Handle sensitive data appropriately

## Accessibility Requirements
- Use semantic HTML elements
- Provide proper ARIA labels
- Ensure keyboard navigation works
- Maintain proper color contrast ratios
