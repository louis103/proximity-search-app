/* eslint-disable no-unused-vars */
import axios from "axios";
import { Icon } from "leaflet";
import React, { useState, useEffect } from "react";
import { Alert, Modal, Button, Tab, Tabs, Form, Spinner } from 'react-bootstrap'; 
import SearchIcon from '@mui/icons-material/Search';
import { MapContainer, Marker, Popup, TileLayer, useMap, GeoJSON, useMapEvents, LayersControl, CircleMarker } from "react-leaflet";
import useSWR from "swr";
import HomeIcon from '@mui/icons-material/Home';
import FilterAltIcon from '@mui/icons-material/FilterAlt'; // For indicating filter & upload button
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';

import 'leaflet/dist/leaflet.css';
import './App.css';
import L from 'leaflet';
import SidebarDialog from "./components/SidebarDialog";
import ResetMapToDefault from "./components/ResetMapToDefault";
import MapLegend from "./components/MapLegend";


import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const { BaseLayer } = LayersControl;

function App() {

  // Handle states for Filtering & Uploading CSV/geojson files
  const [filteredData, setFilteredData] = useState([]);
  const [show, setShow] = useState(false);
  const [activeTab, setActiveTab] = useState('filter');
  const [levelOrStatus, setLevelOrStatus] = useState('');
  const [secondaryDropdown, setSecondaryDropdown] = useState([]);
  const [selectedOption, setSelectedOption] = useState('');

  // const [selectedFile, setSelectedFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [selectedGeoJSONFile, setSelectedGeoJSONFile] = useState(null); // To store the selected file
  const [uploadedGeoJSON, setUploadedGeoJSON] = useState(null); // To store the parsed GeoJSON data

  // Handle showing and closing the dialog
  const toggleDialog = () => setShow(!show);

  // Handle changes in the first dropdown
  const handleFirstDropdownChange = (e) => {
    const option = e.target.value;
    setLevelOrStatus(option);
    setSelectedOption(''); // Set the selected option
    // setSelectedOption(''); // Reset the second dropdown value
    if (option === 'LEVEL') {
      setSecondaryDropdown(['Secondary', 'Primary']);
    } else if (option === 'STATUS') {
      setSecondaryDropdown(['Private', 'Public']);
    }
    // Reset the map (clear any previous filters or proximity results)
    setFilteredData([]);
  };

  // Handle changes in the secondary dropdown (actual filter value)
  const handleSecondDropdownChange = (e) => {
    const option = e.target.value;
    setSelectedOption(option); // Set the actual filtering value (Secondary, Primary, Private, Public)
  };

  // Handle geojson file upload
  const handleGeoJSONFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.geojson')) {
      setSelectedGeoJSONFile(file);
    } else {
      toast.error("Please upload a valid .geojson file.");
      setSelectedGeoJSONFile(null);
    }
  };

  // Handle file upload
  const handleGeoJSONFileUpload = () => {
    if (!selectedGeoJSONFile) return;
    if (uploadedGeoJSON) setUploadedGeoJSON(null);  // Clear any previously uploaded GeoJSON data

    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const geojson = JSON.parse(event.target.result);  // Parse the file content to JSON
        if (geojson.type === "FeatureCollection") {
          setUploadedGeoJSON(geojson);  // Store the parsed GeoJSON in state
          setIsProcessing(false);
          toast.success(`GeoJSON file uploaded successfully!`);
          toggleDialog();  // Close the dialog when uploading finishes
        } else {
          toast.error(`Invalid GeoJSON format. Please upload a valid file.`);
          setIsProcessing(false);
        }
      } catch (error) {
        toast.error(`Error parsing GeoJSON file: ${error.message}`);
        setIsProcessing(false);
      }
    };
    reader.readAsText(selectedGeoJSONFile);
  };

  // Function to render the uploaded GeoJSON data
  const renderUploadedGeoJSON = () => {
    if (!uploadedGeoJSON) return null;
  
    return (
      <GeoJSON
        data={uploadedGeoJSON}
        pointToLayer={(feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 6,
            fillColor: "purple",  // Purple circles for uploaded data
            color: "purple",
            weight: 1,
            opacity: 1,
            fillOpacity: 1,
          });
        }}
        onEachFeature={(feature, layer) => {
          const properties = feature.properties;
          const popupContent = Object.keys(properties).map((key) => 
            `<strong>${key}:</strong> ${properties[key]}<br/>`
          ).join("");
          layer.bindPopup(popupContent);  // Dynamically generate popup content based on properties
        }}
      />
    );
  };
  
  const handleFilter = () => {
    if (!selectedOption || !levelOrStatus) return; // Exit if no primary or secondary option is selected
    const filteredResults = schools.features.filter((feature) => {
          return feature.properties[levelOrStatus] === selectedOption
        }
    );
    setFilteredData(filteredResults); // Update the filtered data
  };

  // Function to handle dialog close
  const handleClose = () => {
    toggleDialog();
  };

  const handleCloseDialog = () => {
    setSelectedGeoJSONFile(null); // Clear uploaded GeoJSON data. This makes sure file is closed and no arising memory leaks.
    toggleDialog();
  };

  // States for selected latitude, longitude, radius, loading status and storing proximity results
  const [selectedLat, setSelectedLat] = useState(null);
  const [selectedLng, setSelectedLng] = useState(null);
  const [radius, setRadius] = useState(5); // Initializes initial query radius as 5km
  const [loading, setLoading] = useState(false); // For showing spinner during API request | this will tell user that the query is executing
  const [proximityResults, setProximityResults] = useState([]); // Store the result from proximity search

  // Function to handle map click
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        // Set latitude and longitude based on map click
        setSelectedLat(e.latlng.lat);
        setSelectedLng(e.latlng.lng);
      },
    });
    return null;
  };

  // Function to handle radius input change
  const handleRadiusChange = (e) => {
    const value = e.target.value;
    // Ensure the radius is always a number or 5km by default
    setRadius(value ? Number(value) : 5);
  };

  // A submit function to send proximity search query to Node.js backend
  const submitData = async (e) => {
    // Prevent the click event from triggering map click event
    if (e){
      e.stopPropagation();
    }

    setLoading(true); // Show spinner to indicate a query is ongoing

    try {
      // Calling a Node.js endpoint to perform proximity search
      const response = await fetch('https://proximity-search-api-85eba53ab9bf.herokuapp.com/api/proximity-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: selectedLat,
          longitude: selectedLng,
          radius,
        }),
      });

      const res = await response.json();
      setProximityResults(res.data); // Store proximity search result to state
      let len;
      if (res.data){
        len = res.data.length;
        // Show a success toast with the number of features returned
        toast.success(`Query successful! ${len} features returned.`);
      }else{
        len = 0;
        toast.success(`Query successful! No features found.`);
      }

    } catch (error) {
      // Show an error toast
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false); // Hide spinner after API request is complete
    }
  };

  // Function to reset the map to its default state
  const resetMap = () => {
    setSelectedLat(null);
    setSelectedLng(null);
    setRadius(null);
    setProximityResults([]); // Clear proximity results
    setFilteredData([]); // Clear filtered data

    setLevelOrStatus(''); // Reset the level or status dropdown
    setSelectedOption(''); // Reset the selected option
    setUploadedGeoJSON(null);  // Reset uploaded GeoJSON data - This returns map to initial schools.geojson
  };

  // Function to handle dismiss button click
  const handleDismiss = (e) => {
    // Prevent the click event from triggering map click event
    if (e){
      e.stopPropagation();
    }

    // Reset all states to clear marker and close dialog
    setSelectedLat(null);
    setSelectedLng(null);
    setRadius(null);
    setProximityResults([]);
  };

  // Initialize Leaflet once the component is mounted on the client side, and provide icons.
  const icon = new L.Icon({
    iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.7.1/dist/images/marker-icon.png',
    iconSize: [22, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const fetcher = (url) => axios.get(url).then((res) => res.data);
  const geojsonUrl = '/data/schools.geojson';

  const position = [-1.2921, 36.8219];
  const zoom = 6.6;

  const { data, error } = useSWR(geojsonUrl, fetcher);
  const schools = data && !error ? data : {};

  if (error) {
      return <Alert variant="danger">A problem occurred while loading data!</Alert>;
  }
  // shows spinner to indicate map is loading data
  if (!data) {
      return (
        <Spinner
            animation="grow"
            variant="danger"
            role="status"
            style={{
              width: "400px",
              height: "400px",
              margin: "auto",
              display: "block",
            }}
        />
      );
  }

  // Function to style the GeoJSON points as circles
  const pointToLayer = (feature, latlng) => {

    return L.circleMarker(latlng, {
      radius: 6,        
      fillColor: 'red',
      color: '#000',
      weight: 1,
      opacity: 1,
      fillOpacity: 0.8
    });
  };

   // Function to bind popup with feature's properties
   const onEachFeature = (feature, layer) => {
    if (feature.properties && feature.properties.SCHOOL_NAM) {
      layer.bindPopup(`<b>School Name:</b> ${feature.properties.SCHOOL_NAM}<br/>
                       <b>Level:</b> ${feature.properties.LEVEL}<br/>
                       <b>Status:</b> ${feature.properties.STATUS}<br/>
                       <b>County:</b> ${feature.properties.COUNTY}<br/>
                       <b>Latitude:</b> ${feature.properties.LATITUDE}<br/>
                       <b>Longitude:</b> ${feature.properties.LONGITUDE}`);
    }
  };

  return (
    <>
    {/* Navbar */}
    <Navbar bg="dark" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="#home">
            <img
              alt=""
              src="proximity_icon.png"
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{' '}
            Proximity App
          </Navbar.Brand>
        </Container>
    </Navbar>
    {/* Reset Map to default button */}
    <Button variant="danger" style={floatingButtonStyleHome} onClick={resetMap}>
      <HomeIcon />
    </Button>

    {/* Modal Dialog for filtering */}
    <Modal show={show} onHide={handleClose} backdrop="static" keyboard={false} dialogClassName="custom-modal">
        <Modal.Header closeButton>
          <Modal.Title>Advanced Options</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-3">
            {/* Tab 1: Filtering */}
            <Tab eventKey="filter" title="Filtering">
              <Form>
                <Form.Group>
                  <Form.Label>Select Filter Type</Form.Label>
                  <Form.Control as="select"  value={levelOrStatus} onChange={handleFirstDropdownChange}>
                    <option value="">Select...</option>
                    <option value="LEVEL">LEVEL</option>
                    <option value="STATUS">STATUS</option>
                  </Form.Control>
                </Form.Group>
                <Form.Group>
                  <Form.Label>Options</Form.Label>
                  <Form.Control as="select"  value={selectedOption} disabled={!levelOrStatus} onChange={handleSecondDropdownChange}>
                    <option value="">Select...</option>
                    {secondaryDropdown.map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
                <br />
                <Button variant="primary" disabled={!levelOrStatus || !selectedOption} onClick={handleFilter}>
                  Run Filter
                </Button>
                <Button variant="danger" onClick={handleCloseDialog} style={{ marginLeft: '10px' }}>
                  Dismiss
                </Button>
              </Form>
            </Tab>

            {/* Tab 2: File Upload */}
            <Tab eventKey="upload" title="Upload a GeoJSON">
            <p><span style={{ color: 'red', fontSize: '15px' }}>*</span>Please upload a .geojson file of type Point with correct SRID 4326. <br /> This will allow easy parsing of the data for visualization, querying & storage to db. Access such an example geojson file <a target='_blank' rel="noreferrer" href='https://drive.google.com/file/d/1KkQ7IgZCOjEYrcwaGj78dNJd0xiaql3C/view?usp=sharing'>here</a></p>

              <div className="upload-pane">
                <input
                  type="file"
                  accept=".geojson"
                  onChange={handleGeoJSONFileChange}
                  className="file-input"
                />
                <Button
                  variant="primary"
                  onClick={handleGeoJSONFileUpload}
                  disabled={!selectedGeoJSONFile || isProcessing}
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
                    Upload GeoJSON
                    </>   
                  )}
                </Button>
                
              </div>
              <Button variant="danger" onClick={handleCloseDialog} style={{justifyContent: 'center', justifySelf: 'center'}}>
                  Dismiss
              </Button>
            </Tab>
          </Tabs>
        </Modal.Body>
    </Modal>
    {/* End of the modal */}

    {/* The ToastContainer is where toasts are displayed */}
    <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />

    {/* Sidebar Dialog */}
    {/* <SidebarDialog /> */}
    {/* Floating Button to toggle the dialog */}
    <Button style={floatingButtonStyle} onClick={toggleDialog}>
        <FilterAltIcon />
    </Button>


    {/* Map Legend */}
    <MapLegend />

    {/* Map container for holding map components */}
    <MapContainer center={position} zoom={zoom} scrollWheelZoom={true}>
      <LayersControl position="topright">
        {/* Mapbox GL Dark Layer */}
        <BaseLayer checked name="Mapbox Dark">
          <TileLayer
            url="https://api.mapbox.com/styles/v1/mapbox/dark-v10/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibG91aXMyNTQiLCJhIjoiY2tyZmN4eTAyMjBubDJ2cXV1cmVsOTF2eCJ9.J0q374yfq2yUrbXBAY15jA"
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox GL</a>'
          />
        </BaseLayer>

        {/* OpenStreetMap Base Layer */}
        <BaseLayer name="OpenStreetMap">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </BaseLayer>

        {/* Mapbox GL Street Layer */}
        <BaseLayer name="Mapbox Streets">
          <TileLayer
            url="https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=pk.eyJ1IjoibG91aXMyNTQiLCJhIjoiY2tyZmN4eTAyMjBubDJ2cXV1cmVsOTF2eCJ9.J0q374yfq2yUrbXBAY15jA"
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/">Mapbox GL</a>'
          />
        </BaseLayer>

        {/* Handle map clicks */}
      <MapClickHandler />

      {/* Conditionally render the marker and dialog when lat/lng are selected */}
      {selectedLat && selectedLng && (
        <Marker position={[selectedLat, selectedLng]} icon={icon}>
          <Popup closeButton={false}>
            <div style={{ width: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent:'center' }}>
                <SearchIcon style={{ marginRight: '8px' }} /> {/* Search Icon */}
                <h6 style={{ margin: 0 }}><strong>Proximity Search</strong></h6> {/* Title next to the icon */}
              </div>
              <br/>
              <Form>
              <div>
                <Form.Label>Latitude: </Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  value={selectedLat}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <Form.Label>Longitude: </Form.Label>
                <Form.Control
                  type="text"
                  size="sm"
                  value={selectedLng}
                  disabled
                  readOnly
                />
              </div>
              <div>
                <Form.Label>Radius (in km): </Form.Label>
                <Form.Control 
                  type="number"
                  value={radius !== null ? radius : 5}
                  required
                  min={1}
                  size="sm"
                  onChange={handleRadiusChange}
                  placeholder="Enter radius | default is 5km" 
                />
                <br />
              </div>

              {/* Submit Button - shows spinner when loading */}
              <Button
                variant="primary"
                type="submit"
                onClick={(e) => submitData(e)}
                disabled={loading} // Disable button while loading
                style={{ width: '100%', marginBottom: '10px' }}
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    Querying...
                  </>
                ) : (
                  'Query'
                )}
              </Button>
              </Form>

              {/* Dismiss Button */}
              <Button
                variant="danger"
                style={{ width: '100%', marginBottom: '10px' }}
                onClick={(e) => handleDismiss(e)}
                >
                Dismiss
              </Button>

            </div>
          </Popup>
        </Marker>
      )}

          {uploadedGeoJSON && renderUploadedGeoJSON()} ? ({ proximityResults && proximityResults.length > 0 ? (
            // If proximity results are available, render green circles for them
            proximityResults.map((result, index) => (
              <CircleMarker
                key={index}
                center={[result.latitude, result.longitude]}
                radius={6} // Circle radius of 6
                pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 1 }} // Green color for proximity results
              >
                <Popup>
                  <div>
                    <p><strong>School Name:</strong> {result.school_nam}</p>
                    <p><strong>Level:</strong> {result.level}</p>
                    <p><strong>Status:</strong> {result.status}</p>
                    <p><strong>County:</strong> {result.county}</p>
                    <p><strong>Latitude:</strong> {result.latitude}</p>
                    <p><strong>Longitude:</strong> {result.longitude}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          ) : filteredData && filteredData.length > 0 ? (
            // If filtered data is available (after filtering), render yellow circles
            filteredData.map((feature, index) => (
              <CircleMarker
                key={index}
                center={[feature.geometry.coordinates[1], feature.geometry.coordinates[0]]} // Coordinates from GeoJSON
                radius={6} // Circle radius of 6
                pathOptions={{ color: 'yellow', fillColor: 'yellow', fillOpacity: 1 }} // Yellow color for filtered data
              >
                <Popup>
                  <div>
                    <p><strong>School Name:</strong> {feature.properties.SCHOOL_NAM}</p>
                    <p><strong>Level:</strong> {feature.properties.LEVEL}</p>
                    <p><strong>Status:</strong> {feature.properties.STATUS}</p>
                    <p><strong>County:</strong> {feature.properties.COUNTY}</p>
                    <p><strong>Latitude:</strong> {feature.properties.LATITUDE}</p>
                    <p><strong>Longitude:</strong> {feature.properties.LONGITUDE}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))
          ) : (
            // If neither proximity results nor filtered nor own uploaded data is available, render the default GeoJSON
            <GeoJSON
              data={data} // Original GeoJSON data
              pointToLayer={pointToLayer} // Custom point rendering (if any)
              onEachFeature={onEachFeature} // Popup or other feature interactions
            />
          )})
          
          {/* End of rendering data */}

        
        </LayersControl>     
    </MapContainer>
    </>
  );
}

// styling for the button used to reset Map state
const floatingButtonStyle = {
  position: 'absolute',
  top: '25vh',
  left: '10px',
  zIndex: 1000,
};

const floatingButtonStyleHome = {
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

// Append the custom styles to the document head
const styleElement = document.createElement('style');
styleElement.innerHTML = customModalCss;
document.head.appendChild(styleElement);


export default App;
