'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAxiosSecure } from '../useApi';
import { queryKeys } from '../../lib/queryKeys';

export function useAdminUsersQuery(options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.admin.users(),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/admin/users');
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 3 * 60 * 1000,
    ...options,
  });
}

export function useAdminCompaniesQuery(options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.admin.companies(),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/companies');
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useAdminDiscountsQuery(options = {}) {
  const axiosSecure = useAxiosSecure();

  return useQuery({
    queryKey: queryKeys.admin.discounts(),
    queryFn: async () => {
      const res = await axiosSecure.get('/api/discounts/admin');
      return res.data?.success ? res.data.data : [];
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

export function useAdminMutations() {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
  };

  const createCategory = useMutation({
    mutationFn: (data) => axiosSecure.post('/api/categories/admin', data),
    onSuccess: invalidateCatalog,
  });

  const updateCategory = useMutation({
    mutationFn: ({ id, data }) => axiosSecure.put(`/api/categories/admin/${id}`, data),
    onSuccess: invalidateCatalog,
  });

  const deleteCategory = useMutation({
    mutationFn: (id) => axiosSecure.delete(`/api/categories/admin/${id}`),
    onSuccess: invalidateCatalog,
  });

  const createProduct = useMutation({
    mutationFn: (data) => axiosSecure.post('/api/products/admin', data),
    onSuccess: invalidateCatalog,
  });

  const updateProduct = useMutation({
    mutationFn: ({ id, data }) => axiosSecure.put(`/api/products/admin/${id}`, data),
    onSuccess: invalidateCatalog,
  });

  const deleteProduct = useMutation({
    mutationFn: (id) => axiosSecure.delete(`/api/products/admin/${id}`),
    onSuccess: invalidateCatalog,
  });

  const createUser = useMutation({
    mutationFn: (data) => axiosSecure.post('/api/admin/create', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.staff() });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }) => axiosSecure.put(`/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.staff() });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id) => axiosSecure.delete(`/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.staff() });
    },
  });

  const createDiscount = useMutation({
    mutationFn: (data) => axiosSecure.post('/api/discounts/admin', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.discounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.presetDiscounts() });
    },
  });

  const deleteDiscount = useMutation({
    mutationFn: (id) => axiosSecure.delete(`/api/discounts/admin/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.discounts() });
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.presetDiscounts() });
    },
  });

  const updateCompanySettings = useMutation({
    mutationFn: (data) => axiosSecure.put('/api/companies/my/settings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.companies() });
    },
  });

  const createCompany = useMutation({
    mutationFn: (data) => axiosSecure.post('/api/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.companies() });
    },
  });

  const assignCompanyAdmin = useMutation({
    mutationFn: ({ companyId, data }) => axiosSecure.post(`/api/companies/${companyId}/admins`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.users() });
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.companies() });
    },
  });

  const updateCompany = useMutation({
    mutationFn: ({ companyId, data }) => axiosSecure.put(`/api/companies/${companyId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admin.companies() });
    },
  });

  return {
    createCategory,
    updateCategory,
    deleteCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    createUser,
    updateUser,
    deleteUser,
    createDiscount,
    deleteDiscount,
    updateCompanySettings,
    createCompany,
    assignCompanyAdmin,
    updateCompany,
  };
}
