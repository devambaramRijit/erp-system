import React, { useState, useEffect } from 'react';
import { Typography, Button, Table, Modal, Form, Input, Space, DatePicker, InputNumber, Select, message, List } from 'antd';
import { DeleteOutlined, EditOutlined, CopyOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;

interface Expense {
  key: React.Key;
  date: string;
  category: string;
  amount: number;
  description: string;
}

const initialCategories = [
  "Miscellaneous", "Maintenance", "Adhesive", "Charity", "Packaging", 
  "Shipping", "Freight", "Office", "Travelling", "Supplies", 
  "Salary", "Utilities", "God", "Home", "Raw Material", "Other"
];

const ExpensesScreen: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>(() => {
    const storedCategories = localStorage.getItem('expenseCategories');
    if (storedCategories) {
      try {
        const parsed = JSON.parse(storedCategories);
        return Array.isArray(parsed) ? parsed : initialCategories;
      } catch (e) {
        return initialCategories;
      }
    }
    return initialCategories;
  });

  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  const [expenseForm] = Form.useForm();
  const [categoryForm] = Form.useForm();

  // Load expenses from localStorage on component mount
  useEffect(() => {
    const storedExpenses = localStorage.getItem('expensesData');
    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    }
  }, []);

  // Save expenses to localStorage whenever the expenses state changes
  useEffect(() => {
    localStorage.setItem('expensesData', JSON.stringify(expenses));
  }, [expenses]);

  // Save categories to localStorage whenever the categories state changes
  useEffect(() => {
    localStorage.setItem('expenseCategories', JSON.stringify(categories));
  }, [categories]);

  const showExpenseModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      expenseForm.setFieldsValue({
        ...expense,
        date: dayjs(expense.date, 'YYYY-MM-DD')
      });
    } else {
      setEditingExpense(null);
      expenseForm.resetFields();
    }
    setIsExpenseModalVisible(true);
  };

  const handleExpenseCancel = () => {
    setIsExpenseModalVisible(false);
    setEditingExpense(null);
    expenseForm.resetFields();
  };

  const onFinishExpense = (values: { date: any; category: string; amount: number; description: string }) => {
    if (editingExpense) {
      const updatedExpenses = expenses.map(expense =>
        expense.key === editingExpense.key
          ? { ...expense, ...values, date: values.date.format('YYYY-MM-DD') }
          : expense
      );
      setExpenses(updatedExpenses);
      message.success('Expense updated successfully!');
    } else {
      const newExpense: Expense = {
        key: Date.now(),
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      };
      setExpenses([...expenses, newExpense]);
      message.success('Expense added successfully!');
    }
    setIsExpenseModalVisible(false);
    setEditingExpense(null);
    expenseForm.resetFields();
  };

  const showCategoryModal = () => {
    setIsCategoryModalVisible(true);
  };

  const handleCategoryCancel = () => {
    setIsCategoryModalVisible(false);
    categoryForm.resetFields();
  };

  const handleAddCategory = () => {
    categoryForm.validateFields().then(values => {
      const { newCategoryName } = values;
      if (newCategoryName && newCategoryName.trim() !== '') {
        const trimmedCategory = newCategoryName.trim();
        if (!categories.find(cat => cat.toLowerCase() === trimmedCategory.toLowerCase())) {
          setCategories([...categories, trimmedCategory]);
          message.success(`Category "${trimmedCategory}" added successfully!`);
          categoryForm.resetFields();
        } else {
          message.error('This category already exists.');
        }
      } else {
        message.error('Category name cannot be empty.');
      }
    }).catch(info => {
      console.log('Validate Failed:', info);
    });
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    const isCategoryInUse = expenses.some(expense => expense.category === categoryToDelete);

    if (isCategoryInUse) {
      message.error(`Category "${categoryToDelete}" is in use and cannot be deleted.`);
      return;
    }

    Modal.confirm({
      title: `Are you sure you want to delete the category "${categoryToDelete}"?`,
      content: 'This action cannot be undone.',
      okText: 'Yes, delete it',
      okType: 'danger',
      onOk: () => {
        setCategories(categories.filter(cat => cat !== categoryToDelete));
        message.success(`Category "${categoryToDelete}" deleted successfully.`);
      },
    });
  };

  const handleDelete = (key: React.Key) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this expense?',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: () => {
        setExpenses(expenses.filter(item => item.key !== key));
        message.success('Expense deleted successfully!');
      },
    });
  };

  const handleDuplicate = (expense: Expense) => {
    const newExpense: Expense = {
      ...expense,
      key: Date.now(),
      description: `${expense.description} (Copy)`,
    };
    setExpenses([newExpense, ...expenses]);
    message.success('Expense duplicated successfully!');
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount: number) => `₹${amount.toFixed(2)}`,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Expense) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => showExpenseModal(record)}>Edit</Button>
          <Button icon={<CopyOutlined />} onClick={() => handleDuplicate(record)}>Duplicate</Button>
          <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.key)} danger>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={2}>Expenses</Title>
        <Space>
          <Button type="default" onClick={showCategoryModal}>
            Manage Categories
          </Button>
          <Button type="primary" onClick={() => showExpenseModal()}>
            Add Expense
          </Button>
        </Space>
      </Space>
      
      <Table columns={columns} dataSource={expenses} rowKey="key" />

      {/* Add/Edit Expense Modal */}
      <Modal
        title={editingExpense ? "Edit Expense" : "Add New Expense"}
        open={isExpenseModalVisible}
        onCancel={handleExpenseCancel}
        footer={null}
      >
        <Form form={expenseForm} layout="vertical" onFinish={onFinishExpense}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: 'Please select a date!' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select a category!' }]}
          >
            <Select placeholder="Select a category" showSearch>
              {categories.map(category => (
                <Select.Option key={category} value={category}>
                  {category}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, type: 'number', message: 'Please input a valid amount!' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} prefix="₹" />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingExpense ? 'Update Expense' : 'Save Expense'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Manage Categories Modal */}
      <Modal
        title="Manage Categories"
        open={isCategoryModalVisible}
        onCancel={handleCategoryCancel}
        footer={[
          <Button key="back" onClick={handleCategoryCancel}>
            Close
          </Button>
        ]}
      >
        <Form form={categoryForm} layout="inline" onFinish={handleAddCategory} style={{ marginBottom: 24 }}>
          <Form.Item
            name="newCategoryName"
            rules={[{ required: true, message: 'Please enter a category name!' }]}
            style={{ flex: 1 }}
          >
            <Input placeholder="Enter new category name" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Add Category
            </Button>
          </Form.Item>
        </Form>
        
        <Title level={5}>Existing Categories</Title>
        <List
          bordered
          dataSource={categories}
          renderItem={item => (
            <List.Item
              actions={[<Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteCategory(item)} />]}
            >
              {item}
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
};

export default ExpensesScreen;
