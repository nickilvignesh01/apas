import React from "react";
import { useNavigate } from "react-router-dom";
import "../css/Help.css";

const Help = () => {
  const navigate = useNavigate();

  return (
    <div className="help-container">
      <h1>Faculty Portal Help</h1>

      <section className="help-section">
        <h2>Overview</h2>
        <p>
          The Faculty Portal (APAS) streamlines academic processes for faculty members. It allows you to manage assignment marks, generate consolidated reports for courses, and upload marks via Excel or PDF files. This help page provides step-by-step guidance to use the portal effectively.
        </p>
      </section>

      <section className="help-section">
        <h2>Managing Assignment Marks</h2>
        <p>
          The <strong>Assignment Marks</strong> page enables you to enter, edit, upload, and save student marks for assignments. Follow these steps:
        </p>
        <ul>
          <li><strong>Select a Class</strong>: Choose a class from the dropdown menu to load the list of students.</li>
          <li><strong>Set Max Marks</strong>: Enter the maximum marks for the assignment (e.g., 30) and click the blue "Set Max Marks" button.</li>
          <li><strong>Enter Marks</strong>: Click the green "Enter Marks" button to load the student table. Input marks for each student in the table.</li>
          <li><strong>Upload Marks</strong>: Upload an Excel or PDF file with marks using the purple "Upload Marks" button. The file should have columns for "ROLL NO", "NAME", and "MARKS (out of 30)" (or your specified max marks).</li>
          <li><strong>Edit Marks</strong>: If marks are already saved, click the orange "Edit Marks" button to modify them.</li>
          <li><strong>View Marks</strong>: Click the purple "View Marks" button to display previously saved marks.</li>
          <li><strong>Save Marks</strong>: Click the teal "Save Marks" button to save your entries. This button is disabled until you enter or edit marks.</li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Generating Consolidated Reports</h2>
        <p>
          The <strong>Consolidated Report</strong> page displays a summary of tutorial and assignment marks for a course, with options to filter by class and export as a PDF. Follow these steps:
        </p>
        <ul>
          <li><strong>Access the Report</strong>: Navigate to the Consolidated Report page for a specific course.</li>
          <li><strong>Select a Class</strong>: Choose a class from the dropdown (or select "All" to view all students).</li>
          <li><strong>Sort the Report</strong>: Use the "Sort By" dropdown to order the report by roll number or marks (low to high or high to low).</li>
          <li><strong>View Marks</strong>: The table displays student names, roll numbers, tutorial marks (individual and scaled to 15), assignment marks (out of 30), and total marks (out of 30).</li>
          <li><strong>Export as PDF</strong>: Click the "Export as PDF" button to download the report as a PDF file.</li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Troubleshooting</h2>
        <p>Below are solutions to common issues you may encounter:</p>
        <ul>
          <li>
            <strong>404 Error for Assignment Marks</strong>: If you see a "Failed to fetch some data" error or no assignment marks appear in the report:
            <ul>
              <li>Ensure marks are saved for the course and assignment ID (e.g., Assignment 1) using the Assignment Marks page.</li>
              <li>Contact your administrator to verify that the backend server is running and the <code>/api/assignment-marks/:courseId/:assignmentId</code> endpoint is configured.</li>
              <li>Check the MongoDB <code>assignmentmarks</code> collection for data using:<br />
                <code>db.assignmentmarks.find({`{ courseId: "679d14b8dbe04a4fbe0eae2e", assignmentId: 1 }`})</code>
              </li>
            </ul>
          </li>
          <li>
            <strong>Marks Not Saving</strong>: If the "Save Marks" button does not work:
            <ul>
              <li>Ensure you have set the max marks and are in editing mode (after clicking "Enter Marks" or "Edit Marks").</li>
              <li>Verify that all entered marks are between 0 and the max marks.</li>
              <li>Check the browser console for error messages and contact support.</li>
            </ul>
          </li>
          <li>
            <strong>File Upload Fails</strong>: If uploading an Excel or PDF file does not load marks:
            <ul>
              <li>Ensure the file has columns "ROLL NO", "NAME", and "MARKS (out of 30)" (or your max marks).</li>
              <li>Verify the file format is .xlsx, .xls, or .pdf.</li>
              <li>Check the server logs for errors in the <code>/api/upload-marks</code> endpoint.</li>
            </ul>
          </li>
          <li>
            <strong>No Data in Report</strong>: If the Consolidated Report shows "No data available":
            <ul>
              <li>Confirm that tutorial and assignment marks are saved for the selected class.</li>
              <li>Ensure the class name matches the one used in the student and marks data (e.g., "G1").</li>
            </ul>
          </li>
        </ul>
      </section>

      <section className="help-section">
        <h2>Contact Support</h2>
        <p>
          For issues not covered above or further assistance, contact your institution's IT support team or the Faculty Portal administrator.
        </p>
        <p>
          <strong>Email</strong>: 23mx330@psgtech.ac.in<br />
          <strong>Phone</strong>: +91-7010362874
        </p>
      </section>

      <div className="action-buttons">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Help;
