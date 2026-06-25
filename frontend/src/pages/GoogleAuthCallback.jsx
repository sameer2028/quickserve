import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { getMe } from '../store/authSlice';
import { Loader2 } from 'lucide-react';

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Fetch user profile to complete login and update Redux state
      dispatch(getMe())
        .unwrap()
        .then(() => {
          navigate('/');
        })
        .catch(() => {
          navigate('/login?error=Google_Auth_Failed');
        });
    } else {
      navigate('/login?error=Missing_Tokens');
    }
  }, [location, dispatch, navigate]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
      <h2 className="text-xl font-semibold text-gray-900">Completing Google Sign In...</h2>
      <p className="text-gray-500 mt-2">Please wait while we securely log you in.</p>
    </div>
  );
};

export default GoogleAuthCallback;
