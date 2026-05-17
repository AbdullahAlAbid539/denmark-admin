import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, push, onValue, remove, update } 
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase Config Setup
const firebaseConfig = {
    databaseURL: "https://danmark-admin-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const clientForm = document.getElementById("clientForm");
const tableBody = document.getElementById("clientTableBody");
let clientsCache = {}; // এডিট করার সুবিধার্থে ডেটা ক্যাশ রাখার অবজেক্ট

// ইমেজ ফাইলকে Base64 টেক্সটে রূপান্তর করার হেল্পার ফাংশন
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// 1. CREATE & UPDATE function
clientForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("clientId").value;
    const submitBtn = document.getElementById("submitBtn");
    
    const photoFile1 = document.getElementById("clientPhoto1").files[0];
    const photoFile2 = document.getElementById("clientPhoto2").files[0];

    let photo1Base64 = document.getElementById("existingPhoto1Base64").value || "";
    let photo2Base64 = document.getElementById("existingPhoto2Base64").value || "";

    // নতুন ডেটা দেওয়ার সময় ১ম ছবি বাধ্যতামূলক করার চেক
    if (id === "" && !photoFile1) {
        alert("Please select Client Photo 1!");
        return;
    }

    try {
        submitBtn.innerText = "Processing Images... Please wait...";
        submitBtn.disabled = true;

        // ১ম ছবি আপলোড বা এডিট করা হলে তা কনভার্ট করবে
        if (photoFile1) {
            photo1Base64 = await getBase64(photoFile1);
        }
        // ২য় ছবি আপলোড বা এডিট করা হলে তা কনভার্ট করবে
        if (photoFile2) {
            photo2Base64 = await getBase64(photoFile2);
        }
    } catch (err) {
        alert("Error processing images: " + err.message);
        submitBtn.innerText = id === "" ? "Save Client Data" : "Update Client Data";
        submitBtn.disabled = false;
        return;
    }

    const clientData = {
        name: document.getElementById("clientName").value,
        gmail: document.getElementById("clientGmail").value,
        password: document.getElementById("clientPassword").value,
        passportNo: document.getElementById("passportNo").value,
        dob: document.getElementById("dob").value,
        issueDate: document.getElementById("issueDate").value,
        expiryDate: document.getElementById("expiryDate").value,
        visaType: document.getElementById("visaType").value,
        visaStatus: document.getElementById("visaStatus").value,
        photo1: photo1Base64, // ১ম ছবির Base64 স্ট্রিং
        photo2: photo2Base64  // ২য় ছবির Base64 স্ট্রিং
    };

    if (id === "") {
        // Save New Client
        const newRef = push(ref(database, 'clients'));
        set(newRef, clientData)
            .then(() => {
                alert("Data & both Photos Saved Successfully to Firebase!");
                clientForm.reset();
                clearHiddenFields();
            })
            .catch((err) => alert("Error saving data: " + err.message))
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = "Save Client Data";
            });
    } else {
        // Update Existing Client
        const updateRef = ref(database, 'clients/' + id);
        update(updateRef, clientData)
            .then(() => {
                alert("Data & both Photos Updated Successfully!");
                document.getElementById("clientId").value = "";
                clientForm.reset();
                clearHiddenFields();
            })
            .catch((err) => alert("Error updating data: " + err.message))
            .finally(() => {
                submitBtn.disabled = false;
                submitBtn.innerText = "Save Client Data";
            });
    }
});

// হিডেন ফিল্ডগুলো খালি করার ফাংশন
function clearHiddenFields() {
    document.getElementById("existingPhoto1Base64").value = "";
    document.getElementById("existingPhoto2Base64").value = "";
}

// 2. READ (Real-time live view in Table)
const clientsRef = ref(database, 'clients');
onValue(clientsRef, (snapshot) => {
    tableBody.innerHTML = "";
    clientsCache = {}; 

    if (snapshot.exists()) {
        let sl = 1;
        let rowsHtml = "";

        snapshot.forEach((childSnapshot) => {
            const id = childSnapshot.key;
            const data = childSnapshot.val();
            clientsCache[id] = data; 

            let badgeClass = "badge-applied";
            if(data.visaStatus === "Issued") badgeClass = "badge-issued";
            if(data.visaStatus === "Rejected") badgeClass = "badge-rejected";

            // ১ম ছবি কন্ডিশনাল রেন্ডারিং
            const imgHtml1 = data.photo1 
                ? `<img src="${data.photo1}" class="table-img" alt="Photo 1">` 
                : `<span style="color:#999; font-size: 13px;">No Photo</span>`;

            // ২য় ছবি কন্ডিশনাল রেন্ডারিং
            const imgHtml2 = data.photo2 
                ? `<img src="${data.photo2}" class="table-img" alt="Photo 2">` 
                : `<span style="color:#999; font-size: 13px;">No Photo</span>`;

            rowsHtml += `
                <tr>
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
                    <td>${imgHtml1}</td>
                    <td>${imgHtml2}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-edit" data-id="${id}">Edit</button>
                            <button class="btn-delete" data-id="${id}">Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        });
        tableBody.innerHTML = rowsHtml;
    } else {
        tableBody.innerHTML = `<tr><td colspan="13" style="text-align:center;">No data found in Database</td></tr>`;
    }
});

// 3. Event Delegation (টেবিলের ভেতর এক লিসেনারে এডিট এবং ডিলিট ম্যানেজমেন্ট)
tableBody.addEventListener("click", (e) => {
    const id = e.target.getAttribute("data-id");
    if (!id) return;

    // Edit বাটন ক্লিক লজিক
    if (e.target.classList.contains("btn-edit")) {
        const data = clientsCache[id];
        if (data) {
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
            
            // এডিটের সময় পূর্বের ২টি ছবির ডেটা ব্যাকআপ রাখা হলো
            document.getElementById("existingPhoto1Base64").value = data.photo1 || "";
            document.getElementById("existingPhoto2Base64").value = data.photo2 || "";
            
            // ফাইল ইনপুট ফিল্ড ক্লিয়ার করা হলো
            document.getElementById("clientPhoto1").value = ""; 
            document.getElementById("clientPhoto2").value = ""; 

            document.getElementById("submitBtn").innerText = "Update Client Data";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    // Delete বাটন ক্লিক লজিক
    if (e.target.classList.contains("btn-delete")) {
        if (confirm("Are you sure you want to delete this client?")) {
            remove(ref(database, 'clients/' + id))
                .then(() => alert("Client record deleted!"))
                .catch((err) => alert("Error deleting: " + err.message));
        }
    }
});