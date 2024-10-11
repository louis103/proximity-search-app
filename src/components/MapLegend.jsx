import React, { useState } from 'react';
import LegendToggleSharpIcon from '@mui/icons-material/LegendToggleSharp';
import { Button } from 'react-bootstrap';
import CloseFullscreenSharpIcon from '@mui/icons-material/CloseFullscreenSharp';

const MapLegend = () => {
  const [isVisible, setIsVisible] = useState(false); // State to toggle visibility

  const toggleLegend = () => {
    setIsVisible(!isVisible); // Toggle legend visibility
  };

  return (
    <>
      <Button variant="dark" onClick={toggleLegend} style={styles.toggleButton}>
        {isVisible ? <CloseFullscreenSharpIcon /> : <LegendToggleSharpIcon />}
      </Button>

      {isVisible && (
        <div style={styles.legendContainer}>
          <h4 style={styles.legendTitle}>Legend</h4>
          <table style={styles.legendTable}>
            <thead>
              <tr>
                <th style={styles.tableHeader}><strong>Visual</strong></th>
                <th style={styles.tableHeader}><strong>Description</strong></th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span style={{ ...styles.circle, backgroundColor: 'red' }}></span></td>
                <td>schools</td>
              </tr>
              <tr>
                <td><span style={{ ...styles.circle, backgroundColor: 'green' }}></span></td>
                <td>proximal points</td>
              </tr>
              <tr>
                <td><span style={{ ...styles.circle, backgroundColor: 'purple' }}></span></td>
                <td>my data</td>
              </tr>
              <tr>
                <td><span style={{ ...styles.circle, backgroundColor: 'yellow' }}></span></td>
                <td>filtered data</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// CSS styles for the legend
const styles = {
  toggleButton: {
    position: 'absolute',
    top: '39vh',
    left: '10px',
    zIndex: 1000,
  },
  legendContainer: {
    position: 'absolute',
    bottom: '10px',
    left: '10px',
    padding: '10px',
    backgroundColor: '#333',
    color: '#fff',
    borderRadius: '8px',
    width: '280px',
    height: '200px',
    textAlign: 'center',
    zIndex: 1000,
  },
  legendTitle: {
    margin: '0 0 10px',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#fff',
  },
  legendTable: {
    width: '100%',
  },
  tableHeader: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ddd',
    paddingBottom: '5px',
  },
  circle: {
    display: 'inline-block',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    marginRight: '8px',
  },
};

export default MapLegend;
