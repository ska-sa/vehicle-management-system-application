import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';

test('renders login page', () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    </AuthProvider>
  );
  const loginHeading = screen.getByText(/Login/i);
  expect(loginHeading).toBeInTheDocument();
});