# Loading & Toast System Guide

This guide documents the comprehensive loading and toast notification system implemented in the dealer authentication portal.

## Overview

The application now includes a complete loading and notification system that provides:
- **Loading States**: Visual feedback during API calls and data operations
- **Toast Notifications**: User-friendly success, error, warning, and info messages
- **Loading Animations**: Smooth, professional animations for better UX
- **Consistent Design**: Unified loading and notification patterns across the app

## Components

### 1. Toast System

#### Toast Component (`src/app/components/ui/Toast.tsx`)
- **Purpose**: Individual toast notification with animations
- **Features**:
  - 4 types: success, error, warning, info
  - Auto-dismiss with configurable duration
  - Smooth slide-in/out animations
  - Manual close button
  - Responsive design

#### Toast Container (`src/app/components/ui/ToastContainer.tsx`)
- **Purpose**: Manages multiple toast notifications
- **Features**:
  - Context-based toast management
  - Stacked notifications
  - Easy-to-use hooks
  - Global toast provider

#### Usage Example:
```tsx
import { useToast } from '@/app/components/ui/ToastContainer';

const MyComponent = () => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  
  const handleAction = async () => {
    try {
      await apiCall();
      showSuccess('Operation completed successfully!');
    } catch (error) {
      showError('Operation failed', 'Please try again later.');
    }
  };
};
```

### 2. Loading Components

#### Loading Spinner (`src/app/components/ui/LoadingSpinner.tsx`)
- **Purpose**: Animated loading indicator
- **Features**:
  - 4 sizes: sm, md, lg, xl
  - 3 colors: blue, white, gray
  - Optional text label
  - Smooth spinning animation

#### Loading Button (`src/app/components/ui/LoadingButton.tsx`)
- **Purpose**: Button with built-in loading state
- **Features**:
  - 4 variants: primary, secondary, danger, success
  - 3 sizes: sm, md, lg
  - Loading spinner integration
  - Disabled state during loading
  - Custom loading text

#### Loading Overlay (`src/app/components/ui/LoadingOverlay.tsx`)
- **Purpose**: Full-screen loading overlay
- **Features**:
  - Backdrop blur effect
  - Centered loading spinner
  - Custom text message
  - High z-index for modal-like behavior

### 3. CSS Animations

Enhanced animations in `src/app/globals.css`:
- **Pulse**: Subtle opacity animation
- **Spin**: Rotating animation for spinners
- **Fade-in**: Smooth appearance animation
- **Bounce**: Attention-grabbing animation
- **Toast animations**: Slide-in/out for notifications

## Implementation Examples

### Dashboard Integration

The main dashboard (`src/app/dashboard/page.tsx`) now includes:

1. **Toast Notifications**:
   - Success messages for product operations
   - Error messages for failed API calls
   - Loading states for data fetching

2. **Loading States**:
   - Loading overlay during product form submission
   - Loading spinner for logout process
   - Loading states for data fetching (orders, products, categories)

3. **Enhanced UX**:
   - Immediate feedback for user actions
   - Clear error messages with actionable text
   - Smooth transitions between states

### Component Updates

#### ProductList Component
- Replaced basic loading text with `LoadingSpinner`
- Integrated toast notifications for delete operations
- Enhanced error handling with user-friendly messages

#### CategoryManager Component
- Added loading spinner for category loading
- Toast notifications for CRUD operations
- Improved error handling

#### OrdersManager Component
- Loading spinner for orders data
- Toast notifications for status updates
- Enhanced error feedback

#### ProductForm Component
- Loading button for form submission
- Loading overlay during save operations
- Toast notifications for success/error states

## Usage Patterns

### 1. API Calls with Loading States
```tsx
const [loading, setLoading] = useState(false);
const { showSuccess, showError } = useToast();

const handleApiCall = async () => {
  setLoading(true);
  try {
    await apiCall();
    showSuccess('Operation successful!');
  } catch (error) {
    showError('Operation failed', error.message);
  } finally {
    setLoading(false);
  }
};
```

### 2. Form Submission with Loading Button
```tsx
<LoadingButton
  onClick={handleSubmit}
  loading={isSubmitting}
  variant="primary"
  loadingText="Saving..."
>
  Save Changes
</LoadingButton>
```

### 3. Full-Screen Loading
```tsx
<LoadingOverlay 
  isVisible={isLoading} 
  text="Processing your request..." 
/>
```

### 4. Inline Loading
```tsx
{loading ? (
  <LoadingSpinner size="lg" text="Loading data..." />
) : (
  <DataComponent />
)}
```

## Best Practices

### 1. Toast Notifications
- Use success toasts for completed actions
- Use error toasts with helpful error messages
- Use warning toasts for important notices
- Use info toasts for general information
- Keep messages concise and actionable

### 2. Loading States
- Show loading for all async operations
- Use appropriate loading component size
- Provide meaningful loading text
- Disable interactive elements during loading

### 3. Error Handling
- Always provide user-friendly error messages
- Include actionable suggestions when possible
- Log technical errors for debugging
- Use appropriate error toast types

### 4. Performance
- Minimize loading state duration
- Use optimistic updates where appropriate
- Cache data to reduce loading times
- Provide immediate feedback for user actions

## Demo Component

A demo component (`src/app/components/ui/LoadingDemo.tsx`) is available to showcase all loading and toast functionality. This can be used for testing and demonstration purposes.

## Configuration

### Toast Duration
Default toast duration is 5 seconds. Can be customized per toast:
```tsx
showSuccess('Message', 'Description', 3000); // 3 seconds
```

### Loading Spinner Sizes
- `sm`: 16px (w-4 h-4)
- `md`: 24px (w-6 h-6) - Default
- `lg`: 32px (w-8 h-8)
- `xl`: 48px (w-12 h-12)

### Loading Button Variants
- `primary`: Blue theme
- `secondary`: Gray theme
- `danger`: Red theme
- `success`: Green theme

## Accessibility

All components include:
- Proper ARIA labels
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance

## Browser Support

The loading and toast system works on:
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers
- Progressive Web Apps
- Requires CSS Grid and Flexbox support

## Future Enhancements

Potential improvements:
- Toast queuing system
- Custom toast themes
- Loading skeleton screens
- Progress indicators
- Offline state handling
- Animation performance optimizations 