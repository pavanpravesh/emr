from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from pydantic import BaseModel  
from typing import Dict  
from jwt import encode, decode, ExpiredSignatureError, InvalidTokenError  
import time
import os
import uvicorn
  
# Secret key to encode and decode JWT tokens  
SECRET_KEY = "your_secret_key"  
  
# User data (usually this would be stored in a database)  
fake_users_db = {  
    "john": {  
        "username": "john",  
        "password": "secret",  
    },  
}  
  
# Pydantic model for login requests  
class LoginRequest(BaseModel):  
    username: str  
    password: str  
  
# FastAPI application  
app = FastAPI()

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Security scheme for bearer tokens
security = HTTPBearer()
  
# Function to create a JWT token  
def create_access_token(data: Dict):  
    to_encode = data.copy()  
    expire = time.time() + 3600  # Token valid for 1 hour  
    to_encode.update({"exp": expire})  
    encoded_jwt = encode(to_encode, SECRET_KEY, algorithm="HS256")  
    return encoded_jwt  
  
# Dependency to verify token (usually used in protected endpoints)  
def verify_token(token: str):  
    try:  
        decoded_token = decode(token, SECRET_KEY, algorithms=["HS256"])  
        return decoded_token  
    except ExpiredSignatureError:  
        raise HTTPException(status_code=401, detail="Token expired")  
    except InvalidTokenError:  
        raise HTTPException(status_code=401, detail="Invalid token")  
  
# Login endpoint  
@app.post("/login")  
def login(login_request: LoginRequest):  
    user = fake_users_db.get(login_request.username)  
    if not user or user["password"] != login_request.password:  
        raise HTTPException(status_code=400, detail="Invalid credentials")  
      
    # Create JWT token  
    token = create_access_token({"sub": user["username"]})  
    return {"access_token": token, "token_type": "bearer"}  
  
# Root endpoint redirects to login page
@app.get("/")
def root():
    return RedirectResponse(url="/static/html/login.html")

# Protected endpoint for token verification
@app.get("/api/auth/verify")  
def verify_auth(credentials: HTTPAuthorizationCredentials = Depends(security)):  
    token_data = verify_token(credentials.credentials)
    return {"message": "Authentication verified", "user": token_data["sub"]}

# Sample patient data (in real application, this would come from a database)
patient_records = [
    {
        "id": 1,
        "name": "Emma Wilson",
        "dateOfBirth": "1992-03-15",
        "age": 33,
        "gender": "Female",
        "maritalStatus": "Married",
        "occupation": "Data Scientist",
        "nationality": "American",
        "governmentId": "123-45-6789",
        "phone": "+1 (555) 123-4567",
        "email": "emma.wilson@email.com",
        "address": "123 Tech Ave",
        "city": "Cityville",
        "state": "NY",
        "postalCode": "10001",
        "bloodType": "A+",
        "lastVisit": "2025-10-29",
        "status": "active",
        "medicalHistory": ["Migraine", "Anxiety"],
        "surgicalHistory": [],
        "allergies": ["Pollen"],
        "medications": ["Sumatriptan", "Sertraline"],
        "familyDoctor": "Dr. Sarah Wilson",
            "reports": [
                {"date": "2025-10-29", "tests": "MRI Brain", "reports": "MRI_2024.pdf", "prescription": "Sumatriptan 50mg"},
                {"date": "2025-10-15", "tests": "Blood Test", "reports": "BloodTest_2025.pdf", "prescription": "Sertraline 100mg"}
            ]
    },
    {
        "id": 2,
        "name": "David Chen",
        "dateOfBirth": "1988-08-22",
        "age": 37,
        "gender": "Male",
        "maritalStatus": "Single",
        "occupation": "Software Engineer",
        "nationality": "Canadian",
        "phone": "+1 (555) 234-5678",
        "email": "david.chen@email.com",
        "address": "456 Innovation Dr",
        "city": "Townsburg",
        "state": "CA",
        "postalCode": "90210",
        "bloodType": "O-",
        "lastVisit": "2025-10-28",
        "status": "active",
        "medicalHistory": ["RSI", "Computer Vision Syndrome"],
        "allergies": ["None"],
        "medications": ["Eye Drops"],
        "familyDoctor": "Dr. Michael Chen",
            "reports": [
                {"date": "2025-10-28", "tests": "Eye Exam", "reports": "EyeExam_2025.pdf", "prescription": "Eye Drops"}
            ]
    },
    {
        "id": 3,
        "name": "Sofia Garcia",
        "dateOfBirth": "1995-06-12",
        "age": 30,
        "gender": "Female",
        "maritalStatus": "Single",
        "occupation": "Nurse",
        "nationality": "Spanish",
        "governmentId": "789-01-2345",
        "phone": "+1 (555) 345-6789",
        "email": "sofia.garcia@email.com",
        "address": "789 Healthcare Blvd",
        "city": "Medtown",
        "state": "FL",
        "postalCode": "33101",
        "bloodType": "B+",
        "lastVisit": "2025-10-27",
        "status": "active",
        "medicalHistory": ["Asthma"],
        "surgicalHistory": ["Appendectomy"],
        "allergies": ["Penicillin"],
        "medications": ["Albuterol"],
        "familyDoctor": "Dr. Jessica Martinez",
            "reports": [
                {"date": "2025-10-27", "tests": "Asthma Checkup", "reports": "AsthmaReport_2023.pdf", "prescription": "Albuterol"},
                {"date": "2015-07-01", "tests": "Appendectomy", "reports": "Appendectomy_2015.pdf", "prescription": "Painkillers"}
            ]
    },
    {
        "id": 4,
        "name": "Marcus Johnson",
        "dateOfBirth": "1980-11-30",
        "age": 45,
        "gender": "Male",
        "maritalStatus": "Divorced",
        "occupation": "High School Teacher",
        "nationality": "American",
        "governmentId": "234-56-7890",
        "phone": "+1 (555) 456-7890",
        "email": "marcus.j@email.com",
        "address": "321 Education Lane",
        "city": "Schooltown",
        "state": "IL",
        "postalCode": "60601",
        "bloodType": "A-",
        "lastVisit": "2025-10-26",
        "status": "active",
        "medicalHistory": ["Hypertension", "Type 2 Diabetes"],
        "surgicalHistory": ["Knee Arthroscopy"],
        "allergies": ["Sulfa Drugs"],
        "medications": ["Metformin", "Lisinopril"],
        "familyDoctor": "Dr. Robert Kim",
            "reports": [
                {"date": "2025-10-26", "tests": "Diabetes Check", "reports": "DiabetesCheck_2025.pdf", "prescription": "Metformin, Lisinopril"}
            ]
    },
    {
        "id": 5,
        "name": "Aisha Patel",
        "dateOfBirth": "1990-04-18",
        "age": 35,
        "gender": "Female",
        "maritalStatus": "Married",
        "occupation": "Pharmacist",
        "nationality": "Indian",
        "governmentId": "345-67-8901",
        "phone": "+1 (555) 567-8901",
        "email": "aisha.patel@email.com",
        "address": "567 Pharmacy Road",
        "city": "Healthville",
        "state": "NJ",
        "postalCode": "07001",
        "bloodType": "O+",
        "lastVisit": "2025-10-25",
        "status": "active",
        "medicalHistory": ["Hypothyroidism"],
        "surgicalHistory": [],
        "allergies": ["Latex"],
        "medications": ["Levothyroxine"],
        "familyDoctor": "Dr. Emily Chang",
            "reports": [
                {"date": "2025-10-25", "tests": "Thyroid Panel", "reports": "ThyroidPanel_2024.pdf", "prescription": "Levothyroxine"}
            ]
    },
    {
        "id": 6,
        "name": "James Harrison",
        "dateOfBirth": "1978-09-25",
        "age": 47,
        "gender": "Male",
        "maritalStatus": "Married",
        "occupation": "Construction Manager",
        "nationality": "British",
        "governmentId": "456-78-9012",
        "phone": "+1 (555) 678-9012",
        "email": "james.h@email.com",
        "address": "890 Builder Street",
        "city": "Constructown",
        "state": "TX",
        "postalCode": "75001",
        "bloodType": "AB+",
        "lastVisit": "2025-10-24",
        "status": "inactive",
        "medicalHistory": ["Lower Back Pain", "Carpal Tunnel"],
        "surgicalHistory": ["Carpal Tunnel Release"],
        "allergies": ["Ibuprofen"],
        "medications": ["Acetaminophen"],
        "familyDoctor": "Dr. Thomas Brown",
            "reports": [
                {"date": "2025-10-24", "tests": "Back Pain MRI", "reports": "BackPainMRI_2022.pdf", "prescription": "Acetaminophen"}
            ]
    },
    {
        "id": 7,
        "name": "Olivia Foster",
        "dateOfBirth": "1998-12-03",
        "age": 27,
        "gender": "Female",
        "maritalStatus": "Single",
        "occupation": "Graphic Designer",
        "nationality": "Australian",
        "governmentId": "567-89-0123",
        "phone": "+1 (555) 789-0123",
        "email": "olivia.f@email.com",
        "address": "123 Creative Way",
        "city": "Artville",
        "state": "CA",
        "postalCode": "94105",
        "bloodType": "B-",
        "lastVisit": "2025-10-23",
        "status": "active",
        "medicalHistory": ["Depression", "RSI"],
        "surgicalHistory": [],
        "allergies": ["None"],
        "medications": ["Fluoxetine"],
        "familyDoctor": "Dr. Lisa Park",
            "reports": [
                {"date": "2025-10-23", "tests": "RSI Evaluation", "reports": "RSIReport_2024.pdf", "prescription": "Fluoxetine"}
            ]
    },
    {
        "id": 8,
        "name": "Mohammed Al-Rahman",
        "dateOfBirth": "1985-07-14",
        "age": 40,
        "gender": "Male",
        "maritalStatus": "Married",
        "occupation": "Restaurant Owner",
        "nationality": "Lebanese",
        "governmentId": "678-90-1234",
        "phone": "+1 (555) 890-1234",
        "email": "mohammed.ar@email.com",
        "address": "456 Culinary Lane",
        "city": "Foodtown",
        "state": "MI",
        "postalCode": "48201",
        "bloodType": "A+",
        "lastVisit": "2025-10-22",
        "status": "active",
        "medicalHistory": ["GERD", "High Cholesterol"],
        "surgicalHistory": [],
        "allergies": ["Shellfish"],
        "medications": ["Omeprazole", "Atorvastatin"],
        "familyDoctor": "Dr. Sarah Wilson",
            "reports": [
                {"date": "2025-10-22", "tests": "Cholesterol Test", "reports": "CholesterolTest_2025.pdf", "prescription": "Omeprazole, Atorvastatin"}
            ]
    },
    {
        "id": 9,
        "name": "Lucy Zhang",
        "dateOfBirth": "1993-02-28",
        "age": 32,
        "gender": "Female",
        "maritalStatus": "Single",
        "occupation": "Research Scientist",
        "nationality": "Chinese",
        "governmentId": "789-01-2345",
        "phone": "+1 (555) 901-2345",
        "email": "lucy.z@email.com",
        "address": "789 Laboratory Ave",
        "city": "Scienceville",
        "state": "MA",
        "postalCode": "02108",
        "bloodType": "AB-",
        "lastVisit": "2025-10-21",
        "status": "active",
        "medicalHistory": ["Myopia", "Migraine"],
        "surgicalHistory": ["LASIK"],
        "allergies": ["Dust Mites"],
        "medications": ["Rizatriptan"],
        "familyDoctor": "Dr. Michael Chen",
            "reports": [
                {"date": "2025-10-21", "tests": "Migraine Scan", "reports": "MigraineScan_2025.pdf", "prescription": "Rizatriptan"}
            ]
    },
    {
        "id": 10,
        "name": "Elena Popov",
        "dateOfBirth": "1987-05-19",
        "age": 38,
        "gender": "Female",
        "maritalStatus": "Married",
        "occupation": "Ballet Instructor",
        "nationality": "Russian",
        "governmentId": "890-12-3456",
        "phone": "+1 (555) 012-3456",
        "email": "elena.p@email.com",
        "address": "234 Dance Street",
        "city": "Artstown",
        "state": "NY",
        "postalCode": "10002",
        "bloodType": "O-",
        "lastVisit": "2025-10-20",
        "status": "active",
        "medicalHistory": ["Joint Pain", "Osteoporosis"],
        "surgicalHistory": ["Ankle Surgery"],
        "allergies": ["None"],
        "medications": ["Calcium Supplements", "Vitamin D"],
        "familyDoctor": "Dr. Jessica Martinez",
            "reports": [
                {"date": "2025-10-20", "tests": "Osteoporosis Scan", "reports": "OsteoporosisScan_2025.pdf", "prescription": "Calcium Supplements, Vitamin D"}
            ]
    }
]

# API endpoint to get patients list
@app.get("/api/patients")
async def get_patients(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        # Verify the token first
        token_data = verify_token(credentials.credentials)
        # Return the patient records
        return {"status": "success", "data": patient_records}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# To run the application, use the following command:  
# uvicorn <this_file_name>:app --reload  

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)