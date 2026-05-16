import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } 
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase Config Setup (আপনার দেওয়া ডেটাবেজ লিংক)
const firebaseConfig = {
    databaseURL: "https://danmark-admin-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const clientForm = document.getElementById("clientForm");
const tableBody = document.getElementById("clientTableBody");

// 1. CREATE & UPDATE function
clientForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const id = document.getElementById("clientId").value;
    const clientData = {
        name: document.getElementById("clientName").value,
        gmail: document.getElementById("clientGmail").value,
        password: document.getElementById("clientPassword").value,
        passportNo: document.getElementById("passportNo").value,
        dob: document.getElementById("dob").value,
        issueDate: document.getElementById("issueDate").value,
        expiryDate: document.getElementById("expiryDate").value,
        visaType: document.getElementById("visaType").value,
        visaStatus: document.getElementById("visaStatus").value
    };

    if (id === "") {
        // Save New Client
        const newRef = push(ref(database, 'clients'));
        set(newRef, clientData)
            .then(() => {
                alert("Data Saved Successfully to Firebase!");
                clientForm.reset();
            })
            .catch((err) => alert("Error saving data: " + err.message));
    } else {
        // Update Existing Client
        const updateRef = ref(database, 'clients/' + id);
        update(updateRef, clientData)
            .then(() => {
                alert("Data Updated Successfully!");
                document.getElementById("submitBtn").innerText = "Save Client Data";
                document.getElementById("clientId").value = "";
                clientForm.reset();
            })
            .catch((err) => alert("Error updating data: " + err.message));
    }
});

// 2. READ (Real-time live view in Table)
const clientsRef = ref(database, 'clients');
onValue(clientsRef, (snapshot) => {
    tableBody.innerHTML = "";
    if (snapshot.exists()) {
        let sl = 1;
        snapshot.forEach((childSnapshot) => {
            const id = childSnapshot.key;
            const data = childSnapshot.val();

            let badgeClass = "badge-applied";
            if(data.visaStatus === "Issued") badgeClass = "badge-issued";
            if(data.visaStatus === "Rejected") badgeClass = "badge-rejected";

            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${sl++}</td>
                <td style="font-weight: 500; color: #000;">${data.name}</td>
                <td>${data.gmail}</td>
                <td><code style="background: #f1f1f1; padding: 2px 6px; border-radius:3px;">${data.password}</code></td>
                <td>${data.passportNo}</td>
                <td>${data.dob}</td>
                <td>${data.issueDate}</td>
                <td>${data.expiryDate}</td>
                <td>${data.visaType}</td>
                <td><span class="badge ${badgeClass}">${data.visaStatus}</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-edit" data-id="${id}">Edit</button>
                        <button class="btn-delete" data-id="${id}">Delete</button>
                    </div>
                </td>
            `;
            
            // Event listeners for Edit button
            tr.querySelector(".btn-edit").addEventListener("click", () => {
                document.getElementById("clientId").value = id;
                document.getElementById("clientName").value = data.name;
                document.getElementById("clientGmail").value = data.gmail;
                document.getElementById("clientPassword").value = data.password;
                document.getElementById("passportNo").value = data.passportNo;
                document.getElementById("dob").value = data.dob;
                document.getElementById("issueDate").value = data.issueDate;
                document.getElementById("expiryDate").value = data.expiryDate;
                document.getElementById("visaType").value = data.visaType;
                document.getElementById("visaStatus").value = data.visaStatus;

                document.getElementById("submitBtn").innerText = "Update Client Data";
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });

            // Event listeners for Delete button
            tr.querySelector(".btn-delete").addEventListener("click", () => {
                if (confirm("Are you sure you want to delete this client?")) {
                    remove(ref(database, 'clients/' + id))
                        .then(() => alert("Client record deleted!"))
                        .catch((err) => alert("Error deleting: " + err.message));
                }
            });

            tableBody.appendChild(tr);
        });
    } else {
        tableBody.innerHTML = `<tr><td colspan="11" style="text-align:center;">No data found in Database</td></tr>`;
    }
});