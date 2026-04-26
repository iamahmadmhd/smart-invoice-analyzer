import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import authReducer from './slices/auth-slice';
import invoiceReducer from './slices/invoice-slice';
import jobReducer from './slices/job-slice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        invoices: invoiceReducer,
        jobs: jobReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector);
