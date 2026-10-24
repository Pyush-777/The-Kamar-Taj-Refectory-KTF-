// Test data for a student
const student = {
    name: "Rahul Sharma",
    email: "rahul@example.com",
    password: "Student123",
    studentId: "STU101"
};
// Function to test registration and login
async function testAuth() {
    try {
        // STEP 1: Register the student
        console.log("\n--- Testing Registration ---");

        const registerResponse = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(student)
            }
        );

        const registerData = await registerResponse.json();
        console.log("Status:", registerResponse.status);
        console.log("Response:", registerData);

        // STEP 2: Try registering the same email again
        console.log("\n--- Testing Duplicate Registration ---");

        const duplicateResponse = await fetch(
            "http://localhost:5000/api/auth/register",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(student)
            }
        );

        console.log("Status:", duplicateResponse.status);
        console.log("Response:", await duplicateResponse.json());

        // STEP 3: Log in using the student credentials
        console.log("\n--- Testing Login ---");

        const loginResponse = await fetch(
            "http://localhost:5000/api/auth/login",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: student.email,
                    password: student.password
                })
            }
        );

        const loginData = await loginResponse.json();

        console.log("Status:", loginResponse.status);
        console.log("Response:", loginData);

        // STEP 4: Check whether a JWT token was generated
        if (loginResponse.ok && loginData.token) {
            console.log("\nJWT token generated successfully!");
        } else {
            console.log("\nLogin failed. Check the error above.");
        }

    } catch (error) {
        console.error("Testing error:", error.message);
    }
}

// Run the tests
testAuth();
