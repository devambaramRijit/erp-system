import React, { useState, useEffect, useRef } from 'react';
import { Typography, Button, Table, Modal, Form, Input, Space, Select, DatePicker, InputNumber, Popconfirm, Row, Col, Upload } from 'antd';
import { EditOutlined, DeleteOutlined, UserOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import moment from 'moment';

const { Title } = Typography;
const { Option } = Select;

interface Employee {
  key: React.Key;
  name: string;
  email: string;
  role: string;
  phone?: string;
  address?: string;
  dob?: string;
  occupationType: 'Part Time' | 'Full Time' | 'Freelancer';
  joiningDate?: string;
  salary?: number;
  lastSalaryDate?: string;
  leavingDate?: string;
  lastSalary?: number;
  passportPhoto?: string;
  aadhaarCard?: string;
  panCard?: string;
  rationCard?: string;
}

const EmployeesScreen: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBiodataModalVisible, setIsBiodataModalVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const biodataRef = useRef<HTMLDivElement>(null);
  const occupationType = Form.useWatch('occupationType', form);

  useEffect(() => {
    const storedEmployees = localStorage.getItem('employeesData');
    if (storedEmployees) setEmployees(JSON.parse(storedEmployees));
  }, []);

  useEffect(() => {
    localStorage.setItem('employeesData', JSON.stringify(employees));
  }, [employees]);

  const handleAdd = () => {
    setEditingEmployee(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Employee) => {
    setEditingEmployee(record);
    const fileFields = ['passportPhoto', 'aadhaarCard', 'panCard', 'rationCard'];
    const formValues: any = {
      ...record,
      joiningDate: record.joiningDate ? moment(record.joiningDate) : null,
      leavingDate: record.leavingDate ? moment(record.leavingDate) : null,
      lastSalaryDate: record.lastSalaryDate ? moment(record.lastSalaryDate) : null,
      dob: record.dob ? moment(record.dob) : null,
    };

    for (const field of fileFields) {
        if(record[field]) {
            formValues[field] = [{
                uid: '-1',
                name: `${field}.png`,
                status: 'done',
                url: record[field],
            }];
        }
    }

    form.setFieldsValue(formValues);
    setIsModalVisible(true);
  };

  const handleView = (fieldName: string) => {
    const file = form.getFieldValue(fieldName);
    if (file && file[0]) {
      let url = '';
      let filename = `${fieldName}.pdf`;

      if (file[0].url) { // Existing file (base64 string)
        url = file[0].url;
      } else if (file[0].originFileObj) { // New file
        url = URL.createObjectURL(file[0].originFileObj);
        filename = file[0].name;
      }

      if(url){
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
      }
    }
  };

  const handleFileChange = (fieldName: string, info: any) => {
    form.setFieldsValue({ [fieldName]: info.fileList });
  };

  const handleDelete = (key: React.Key) => {
    setEmployees(employees.filter(emp => emp.key !== key));
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingEmployee(null);
    form.resetFields();
  };

  const onFinish = async (values: any) => {
    const getBase64 = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });

    const newValues = { ...values };

    const fileFields = ['passportPhoto', 'aadhaarCard', 'panCard', 'rationCard'];
    for (const field of fileFields) {
        if (values[field]?.[0]?.originFileObj) {
            newValues[field] = await getBase64(values[field][0].originFileObj);
        } else if (values[field]?.[0]?.url) {
            newValues[field] = values[field][0].url;
        } else {
            newValues[field] = null;
        }
    }

    const processedValues = {
      ...newValues,
      joiningDate: newValues.joiningDate?.format('YYYY-MM-DD'),
      leavingDate: newValues.leavingDate?.format('YYYY-MM-DD'),
      lastSalaryDate: newValues.lastSalaryDate?.format('YYYY-MM-DD'),
      dob: newValues.dob?.format('YYYY-MM-DD'),
    };

    if (editingEmployee) {
      setEmployees(employees.map(emp => emp.key === editingEmployee.key ? { ...editingEmployee, ...processedValues } : emp));
    } else {
      setEmployees([...employees, { ...processedValues, key: Date.now() }]);
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const showBiodata = (record: Employee) => {
    setSelectedEmployee(record);
    setIsBiodataModalVisible(true);
  };

  const handleDownloadBiodata = async () => {
    if (!biodataRef.current || !selectedEmployee) return;

    // Dynamically load pdf.js
    const pdfjsLib = await import('https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.min.mjs');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs';

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();

    // --- Page 1: Biodata Details ---
    const canvas = await html2canvas(biodataRef.current);
    const imgData = canvas.toDataURL('image/png');
    const pageHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pageHeight);

    const addDocumentToPdf = async (doc: jsPDF, dataUrl: string | undefined, pageTitle: string) => {
      if (!dataUrl) return;

      doc.addPage();
      doc.text(pageTitle, 10, 10);

      if (dataUrl.startsWith('data:application/pdf')) {
        // It's a PDF, render with pdf.js
        try {
          const loadingTask = pdfjsLib.getDocument(dataUrl);
          const pdfDoc = await loadingTask.promise;
          const page = await pdfDoc.getPage(1); // Render first page
          const viewport = page.getViewport({ scale: 1.5 });
          
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.height = viewport.height;
          tempCanvas.width = viewport.width;

          if(tempCtx) {
            await page.render({ canvasContext: tempCtx, viewport: viewport }).promise;
            
            const pdfAsImage = tempCanvas.toDataURL('image/jpeg');
            doc.addImage(pdfAsImage, 'JPEG', 10, 20, 180, 240); // Adjust dimensions as needed
          }
        } catch (e) {
          console.error(`Failed to render PDF ${pageTitle}`, e);
          doc.text(`Could not render ${pageTitle}.`, 10, 20);
        }
      } else {
        // It's an image
        try {
          doc.addImage(dataUrl, 'JPEG', 10, 20, 180, 160);
        } catch (e) {
          try {
            doc.addImage(dataUrl, 'PNG', 10, 20, 180, 160);
          } catch (e2) {
            console.error(`Failed to add image ${pageTitle} to PDF`, e2);
          }
        }
      }
    };

    // --- Subsequent Pages: Documents ---
    await addDocumentToPdf(pdf, selectedEmployee.aadhaarCard, 'Aadhaar Card');
    await addDocumentToPdf(pdf, selectedEmployee.panCard, 'PAN Card');
    await addDocumentToPdf(pdf, selectedEmployee.rationCard, 'Ration Card');

    pdf.save(`${selectedEmployee.name}_biodata.pdf`);
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Role', dataIndex: 'role', key: 'role' },
    { title: 'Type', dataIndex: 'occupationType', key: 'occupationType' },
    { title: 'Joining Date', dataIndex: 'joiningDate', key: 'joiningDate' },
    { title: 'Salary', dataIndex: 'salary', key: 'salary', render: (s: number) => s ? `₹${s}`: 'N/A' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Employee) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Edit</Button>
          <Button icon={<UserOutlined />} onClick={() => showBiodata(record)}>Biodata</Button>
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record.key)}><Button danger icon={<DeleteOutlined />}>Delete</Button></Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <Title level={2}>Employees</Title>
        <Button type="primary" onClick={handleAdd}>Add Employee</Button>
      </Space>
      <Table columns={columns} dataSource={employees} rowKey="key" />

      <Modal title={editingEmployee ? 'Edit Employee' : 'Add Employee'} open={isModalVisible} onCancel={handleCancel} footer={null} width={600}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="email" label="Email" rules={[{ type: 'email' }]}><Input /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="role" label="Role" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item name="phone" label="Phone"><Input /></Form.Item></Col>
          </Row>
          <Form.Item name="address" label="Address"><Input.TextArea /></Form.Item>
          <Row gutter={16}>
              <Col span={12}>
                  <Form.Item name="passportPhoto" label="Passport Photo" valuePropName="fileList">
                      <Space>
                        <Upload listType="text" maxCount={1} beforeUpload={() => false} onChange={(info) => handleFileChange('passportPhoto', info)}>
                            <Button icon={<UploadOutlined />}>Upload</Button>
                        </Upload>
                        <Button onClick={() => handleView('passportPhoto')}>View</Button>
                      </Space>
                  </Form.Item>
              </Col>
              <Col span={12}>
                  <Form.Item name="aadhaarCard" label="Aadhaar Card" valuePropName="fileList">
                    <Space>
                      <Upload listType="text" maxCount={1} beforeUpload={() => false} onChange={(info) => handleFileChange('aadhaarCard', info)}>
                          <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                      <Button onClick={() => handleView('aadhaarCard')}>View</Button>
                    </Space>
                  </Form.Item>
              </Col>
          </Row>
          <Row gutter={16}>
              <Col span={12}>
                  <Form.Item name="panCard" label="PAN Card" valuePropName="fileList">
                    <Space>
                      <Upload listType="text" maxCount={1} beforeUpload={() => false} onChange={(info) => handleFileChange('panCard', info)}>
                          <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                      <Button onClick={() => handleView('panCard')}>View</Button>
                    </Space>
                  </Form.Item>
              </Col>
              <Col span={12}>
                  <Form.Item name="rationCard" label="Ration Card" valuePropName="fileList">
                    <Space>
                      <Upload listType="text" maxCount={1} beforeUpload={() => false} onChange={(info) => handleFileChange('rationCard', info)}>
                          <Button icon={<UploadOutlined />}>Upload</Button>
                      </Upload>
                      <Button onClick={() => handleView('rationCard')}>View</Button>
                    </Space>
                  </Form.Item>
              </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="dob" label="Date of Birth"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="occupationType" label="Occupation Type" rules={[{ required: true }]}><Select><Option value="Part Time">Part Time</Option><Option value="Full Time">Full Time</Option><Option value="Freelancer">Freelancer</Option></Select></Form.Item></Col>
          </Row>
          {(occupationType === 'Part Time' || occupationType === 'Full Time') && (
            <Row gutter={16}>
              <Col span={8}><Form.Item name="joiningDate" label="Joining Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
              <Col span={8}><Form.Item name="salary" label="Salary"><InputNumber min={0} style={{ width: '100%' }} formatter={v => `₹ ${v}`} parser={v => v!.replace(/₹\s?|(,*)/g, '')} /></Form.Item></Col>
              <Col span={8}><Form.Item name="lastSalaryDate" label="Last Salary Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            </Row>
          )}
          {occupationType === 'Freelancer' && (
            <Row gutter={16}>
              <Col span={editingEmployee ? 8 : 12}><Form.Item name="joiningDate" label="Joining Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
              {editingEmployee && (
                <Col span={8}><Form.Item name="leavingDate" label="Leaving Date"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
              )}
              <Col span={editingEmployee ? 8 : 12}><Form.Item name="lastSalary" label="Last Salary"><InputNumber min={0} style={{ width: '100%' }} formatter={v => `₹ ${v}`} parser={v => v!.replace(/₹\s?|(,*)/g, '')} /></Form.Item></Col>
            </Row>
          )}
          <Form.Item><Button type="primary" htmlType="submit">Save</Button></Form.Item>
        </Form>
      </Modal>

      <Modal title="Employee Biodata" open={isBiodataModalVisible} onCancel={() => setIsBiodataModalVisible(false)} footer={<Button type="primary" icon={<DownloadOutlined />} onClick={handleDownloadBiodata}>Download PDF</Button>} width={800}>
        {selectedEmployee && (
          <div>
            <div ref={biodataRef} style={{ padding: '24px' }}>
              <Row gutter={16}>
                <Col span={16}>
                  <Title level={3}>{selectedEmployee.name}</Title>
                  <p><strong>Role:</strong> {selectedEmployee.role}</p>
                  <p><strong>Email:</strong> {selectedEmployee.email}</p>
                  <p><strong>Phone:</strong> {selectedEmployee.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {selectedEmployee.address || 'N/A'}</p>
                  <p><strong>Date of Birth:</strong> {selectedEmployee.dob || 'N/A'}</p>
                  <p><strong>Occupation Type:</strong> {selectedEmployee.occupationType}</p>
                  <p><strong>Joining Date:</strong> {selectedEmployee.joiningDate || 'N/A'}</p>
                  {(selectedEmployee.occupationType === 'Part Time' || selectedEmployee.occupationType === 'Full Time') ? <>
                    <p><strong>Salary:</strong> {selectedEmployee.salary ? `₹${selectedEmployee.salary}` : 'N/A'}</p>
                    <p><strong>Last Salary Date:</strong> {selectedEmployee.lastSalaryDate || 'N/A'}</p>
                  </> : <>
                    <p><strong>Leaving Date:</strong> {selectedEmployee.leavingDate || 'N/A'}</p>
                    <p><strong>Last Salary:</strong> {selectedEmployee.lastSalary ? `₹${selectedEmployee.lastSalary}` : 'N/A'}</p>
                  </>}
                </Col>
                <Col span={8}>
                  {selectedEmployee.passportPhoto && <img src={selectedEmployee.passportPhoto} alt="Passport" style={{ maxWidth: '100%', float: 'right' }} />}
                </Col>
              </Row>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
               <Title level={4} style={{marginTop: '20px'}}>Documents</Title>
                <Row gutter={16}>
                    {selectedEmployee.aadhaarCard && <Col span={12}><p><strong>Aadhaar Card:</strong></p><a href={selectedEmployee.aadhaarCard} download={`${selectedEmployee.name}_aadhaar_card.pdf`}>Download Aadhaar Card</a></Col>}
                    {selectedEmployee.panCard && <Col span={12}><p><strong>PAN Card:</strong></p><a href={selectedEmployee.panCard} download={`${selectedEmployee.name}_pan_card.pdf`}>Download PAN Card</a></Col>}
                </Row>
                <Row gutter={16}>
                    {selectedEmployee.rationCard && <Col span={12}><p><strong>Ration Card:</strong></p><a href={selectedEmployee.rationCard} download={`${selectedEmployee.name}_ration_card.pdf`}>Download Ration Card</a></Col>}
                </Row>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmployeesScreen;
