import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, MenuItem } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('employee');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            console.log('Using backend URL:', process.env.REACT_APP_BACKEND_URL); // Debug log
            console.log('Attempting login with', { email, password, role });
            const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/login/`, {
                email,
                password,
                role,
            });
            console.log('Login response:', response.data);
            const { user, token } = response.data;
            if (!user || !token) {
                throw new Error('Invalid response format: user or token missing');
            }
            login(token, user);
            if (user.role === 'admin') navigate('/admin');
            else navigate('/employee');
        } catch (error: any) {
            setError(error.response?.data?.detail || error.message || 'Login failed. Please try again.');
            console.error('Login error:', error.response?.data || error);
        }
    };

    return (
        <Container maxWidth="sm">
            <Typography variant="h4" gutterBottom>
                Login
            </Typography>
            {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                </Typography>
            )}
            <TextField
                fullWidth
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                required
            />
            <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
            />
            <TextField
                select
                fullWidth
                label="Role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                margin="normal"
                required
            >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="employee">Employee</MenuItem>
            </TextField>
            <Button variant="contained" onClick={handleLogin} sx={{ mt: 2 }}>
                Login
            </Button>
        </Container>
    );
};

export default LoginPage;