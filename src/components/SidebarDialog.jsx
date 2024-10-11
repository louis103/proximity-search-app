import React, { useState } from 'react';
import { Modal, Button, Tab, Tabs, Form, Spinner } from 'react-bootstrap'; // Import necessary components
import FilterAltIcon from '@mui/icons-material/FilterAlt'; // For indicating filter & upload button
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';

const SidebarDialog = () => {
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState('filter');
  const [levelOrStatus, setLevelOrStatus] = useState('');
  const [secondaryDropdown, setSecondaryDropdown] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Handle showing and closing the dialog
  const toggleDialog = () => setShow(!show);

  // Handle changes in the first dropdown
  const handleFirstDropdownChange = (e) => {
    const selectedOption = e.target.value;
    setLevelOrStatus(selectedOption);
    if (selectedOption === 'LEVEL') {
      setSecondaryDropdown(['Secondary', 'Primary']);
    } else if (selectedOption === 'STATUS') {
      setSecondaryDropdown(['Private', 'Public']);
    }
  };

  // Handle file upload
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Function to handle filtering
  const handleFilter = () => {
    // Call some filtering logic here
    console.log('Filtering based on:', levelOrStatus);
  };

  // Handle file submission
  const handleFileSubmit = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      console.log('File processed:', selectedFile);
      setIsProcessing(false);
      toggleDialog(); // Close the dialog when processing finishes
      setSelectedFile(null); // Reset file input
    }, 2000);
  };

  // Function to handle dialog close
  const handleClose = () => {
    setSelectedFile(null); // Clear file if the dialog is closed
    toggleDialog(); // Toggle the dialog state
  };

  return (
    <>
      {/* Floating Button to toggle the dialog */}
      <Button style={floatingButtonStyle} onClick={toggleDialog}>
        <FilterAltIcon />
      </Button>

      {/* Modal (Dialog) */}
      <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} dialogClassName="custom-modal">
        <Modal.Header closeButton>
          <Modal.Title>Advanced Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            {/* Tab 1: Filtering */}
            <Tab eventKey="filter" title="Filter">
              <Form>
                <Form.Group>
                  <Form.Label>Select Filter Type</Form.Label>
                  <Form.Control as="select" onChange={handleFirstDropdownChange}>
                    <option value="">Select...</option>
                    <option value="LEVEL">LEVEL</option>
                    <option value="STATUS">STATUS</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Options</Form.Label>
                  <Form.Control as="select" disabled={!levelOrStatus}>
                    <option value="">Select...</option>
                    {secondaryDropdown.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <br />
                <Button variant="primary" onClick={handleFilter}>
                  Run Filter
                </Button>
              </Form>
            </Tab>

            {/* Tab 2: File Upload */}
            <Tab eventKey="upload" title="Upload CSV">
            <p><span style={{ color: 'red', fontSize: '15px' }}>*</span>Please upload a .csv file with two mandatory columns (latitude & longitude). <br /> This will allow easy parsing of the data for visualization, querying & storage to db. Access such an example csv file <a target='_blank' rel="noreferrer" href='https://github.com/louis103'>here</a></p>

              <div className="upload-pane">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <Button
                  variant="primary"
                  onClick={handleFileSubmit}
                  disabled={!selectedFile || isProcessing}
                >
                
                  {isProcessing ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                      Processing...
                    </>
                  ) : (
                    <>
                    <FileUploadOutlinedIcon/>
                    Upload
                    </>   
                  )}
                </Button>
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
      </Modal>
    </>
  );
};

// Floating Button styling
const floatingButtonStyle = {
  position: 'absolute',
  top: '32vh',
  left: '10px',
  zIndex: 1000,
};

// Custom CSS for the modal (dialog)
const customModalCss = `
  .custom-modal .modal-dialog {
    max-width: 600px;
    margin: 1.75rem auto;
  }
  .custom-modal .modal-body {
    padding: 20px;
  }
  .upload-pane {
    padding: 20px;
    border: 2px dashed #ccc;
    text-align: center;
    border-radius: 10px;
    margin-bottom: 10px;
  }
  .file-input {
    display: block;
    margin-bottom: 10px;
  }
`;

// custom styles
const styleElement = document.createElement('style');
styleElement.innerHTML = customModalCss;
document.head.appendChild(styleElement);

export default SidebarDialog;
