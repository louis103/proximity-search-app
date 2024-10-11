import React from 'react';
import { Button } from 'react-bootstrap'; // Import necessary components
import HomeIcon from '@mui/icons-material/Home';

function ResetMapToDefault() {
    const resetMap = () => (
        window.location.reload()
    );
    return (
        <>
        {/* Floating Button to toggle the dialog */}
            <Button variant="danger" style={floatingButtonStyle} onClick={resetMap}>
                <HomeIcon />
            </Button>
        </>
    )
};

const floatingButtonStyle = {
    position: 'absolute',
    top: '25vh',
    left: '10px',
    zIndex: 1000,
  };

export default ResetMapToDefault;