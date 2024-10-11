import React from 'react';
import { FaSearch } from 'react-icons/fa'; // Import the search icon
import Button from 'react-bootstrap/Button';
import { Spinner } from "react-bootstrap";

const SubmitButton = ({ submitData, loading }) => {
  return (
    <Button variant="primary"
        onClick={submitData}
        disabled={loading} // Disable button while loading
        style={{ width: '100%', marginBottom: '10px' }}>
        <FaSearch style={{ marginRight: '8px' }} /> {/* Add the search icon */}
      Query

      {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    Submitting...
                  </>
                ) : (
                  'Submit'
                )}
    </Button>
  );
};

export default SubmitButton;
