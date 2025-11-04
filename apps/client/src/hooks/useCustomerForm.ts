// hooks/useCustomerForm.ts
import { useState } from "react";
import { CustomerData, FormData } from "../types/customer";

const initialFormData: FormData = {
  customerName: '',
  mobileNumber1: '',
  mobileNumber2: '',
  houseNumber: '',
  city: '',
  district: '',
  state: '',
  pinCode: '',
  source: 'Direct',
  notes: '',
};

export const useCustomerForm = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setFormData(initialFormData);
    setEditingCustomer(null);
    setShowForm(false);
    setSaveError(null);
  };

  const startEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      mobileNumber1: customer.mobileNumber1,
      mobileNumber2: customer.mobileNumber2 || '',
      houseNumber: customer.houseNumber || '',
      city: customer.city || '',
      district: customer.district || '',
      state: customer.state || '',
      pinCode: customer.pinCode || '',
      source: customer.source,
      notes: customer.notes || '',
    });
    setShowForm(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    if (!formData.mobileNumber1.trim()) {
      errors.mobileNumber1 = 'Mobile number is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return {
    formData,
    editingCustomer,
    showForm,
    saveError,
    isSaving,
    validationErrors,
    setSaveError,
    setIsSaving,
    setShowForm,
    resetForm,
    startEdit,
    handleInputChange,
    validateForm
  };
};
