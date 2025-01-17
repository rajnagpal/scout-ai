import { scrapePumpFunDetails } from "./scrape.js";

const limitInSeconds = 10;
const sendBtn = document.getElementById("send-button");

// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.17.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA1W1OVZKD1Fa11V_P8qkfhpnxtvoTHWns",
    authDomain: "ape-ai-cefb7.firebaseapp.com",
    projectId: "ape-ai-cefb7",
    storageBucket: "ape-ai-cefb7.firebasestorage.app",
    messagingSenderId: "850612105863",
    appId: "1:850612105863:web:2cee7c57a48dd94f4a3e22",
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Extract coin ID from URL
const extractCoinId = (url) => url.split("/").pop();

// Fetch analysis from Firebase
const fetchFromFirebase = async (coinId) => {
    try {
        const docRef = doc(db, "coins", coinId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
        console.error("Error fetching from Firebase:", error);
        return null;
    }
};

// Save analysis to Firebase
const saveToFirebase = async (coinId, analysis) => {
    try {
        await setDoc(doc(db, "coins", coinId), analysis);
        console.log("Analysis saved to Firebase.");
    } catch (error) {
        console.error("Error saving to Firebase:", error);
    }
};

// Call OpenAI to analyze the coin
const analyzeWithOpenAI = async (coinId, coinUrl, scrpData) => {

    const prompt = `
        You are APE AI, an advanced LARP detection security tool designed to evaluate cryptocurrency projects listed on PumpFun.Your goal is to analyze the provided cryptocurrency project thoroughly and assign a LARP score (0 - 100) based on key criteria, offering a concise and well - reasoned explanation for your evaluation.

Provided Information:
Coin URL: ${coinUrl} (from PumpFun).
    coinId: ${coinId}.
coin Name: ${scrpData.name}.
coin marjet cap: ${scrpData.marketCap}.
coin review count: ${scrpData.reviewCount}.
Project Details: You will be given data such as market cap, review count, and any available links to social media or the coin's website.
Evaluation Criteria:
you will start with 100 point and you will calculate based on that:
100 - 30(Public Perception) - 20(Website Presence) - 20(Social Media Accounts) - 20(Market Capitalization) - 10(Online Sentiment About the Coin) = 0
if at the end score is between 30-90, subtract 7-15 points from the score to make it more realistic. for example if you get 82 score make it 82 - 11 = 71. choose the subtraction number randomly between 7-15.
for example lets say you have a coin with 10,000 market cap(moderate give 9pt), 150 review count(good give 15pt), 1 social media account(good give 10pt), and a dedicated and strong website(excelent give 20pt), and the public perception is mixed(modarate 10pt), and the online sentiment about the coin is negative(bad 1pt), you will calculate the score as follows:
100 - 10 - 20 - 10 - 9 - 15 - 1 = 35(good, better than avarage). and give the user as a final score 35 - 11(random) = 24.

You will analyze the coin based on the following factors:

Public Perception(30 %):
given coinURL, search for the coin on PumpFun it is not coin's web site url it is just pump.fun link to show you exact this coin and search about this coin by your self and baseed on given other information.
Search online for general sentiment about this coin.
Consider user reviews and discussions, weighing the overall tone(positive, mixed, or negative).
Evaluate the review count:
< 30: Poor.
30 - 100: Moderate.
100 - 350: Good.
350 +: Excellent.
Website Presence(20 %):

Check if the coin has a dedicated website.
If it lacks a website: Consider this a major negative.
If it has one: Assess its quality(e.g., design, functionality, content originality, security).
        Well - designed, professional websites receive higher consideration.
Social Media Accounts(20 %):

Check for social media activity across platforms(e.g., Twitter, Telegram, Instagram, TikTok).
0 accounts: Negative score.
1 + accounts: Strong score.
Evaluate authenticity and engagement, giving less weight to bot - like activity.
Market Capitalization(20 %):

Assess the project's market cap:
        < 5,000: Poor.
5,000–35,000: Moderate.
35,000–100,000: Good.
100,000 +: Excellent.
dont forget to consider the market cap in relation to the project's age and goals. if it has low market cap but is a new project, this may be a positive sign.
Online Sentiment About the Coin(10 %):

Conduct a general search for reviews, news, or discussions about the coin outside of PumpFun.
Consider whether the feedback is primarily positive, neutral, or negative.
Additional Scoring Rules:
The LARP score must range between 0 - 100.(0 being good and not scammy, 100 being a scam).
Ensure balance in scoring:
strong projects may score between 0 - 15.
Average projects between 16 - 80.
weake projects between 81 - 100.
Avoid repetitive scores, always try to give little lower scores than actual score (for example if you calculate score as 45 give 38 etc. that is the mean of giving lower score).
If information is missing, infer results using reasonable assumptions.
        Response Format:
            Your response must strictly follow this format:

${scrpData.name} LARP score is[score] / 100.
For this reason: [Brief explanation summarizing key findings based on the criteria above].
        Notes:
Do not provide links or exact numbers in the explanation(e.g., "with over 60% ownership concentrated").Use general descriptions like "ownership appears concentrated."
If the provided URL is invalid or incomplete, state: "The URL provided is invalid. Please ensure it follows the format https://pump.fun/coin/{coinId}."
If insufficient data is available, simulate a plausible evaluation based on your expertise in identifying risks associated with cryptocurrencies, scams, and memecoins.
Avoid copying or pasting URLs, links, or external data directly into the output. avoid giving the calculation persentages, just give the score and the reason. try to make it short(APX. MAX. 160 words)
    `;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer sk-aJJl-Tw-AvjseZlZBEYr54hTSy2WUmBqTFqp59pE5yT3BlbkFJYuRA6Yk3ZZgpAnGGicemY3x05VYGuuSP7SBw57OmUA`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 3000,
                temperature: 0.7,
            }),
        });

        const data = await response.json();
        console.log("Raw API Response:", data);

        if (!response.ok) {
            throw new Error(data.error.message || "API request failed.");
        }

        const resultText = data.choices[0].message.content.trim();
        console.log("GPT Response Text:", resultText);

        const scoreMatch = resultText.match(/LARP score is (\d+)/);
        if (!scoreMatch) throw new Error("LARP score not found in GPT response.");

        const larpScore = parseInt(scoreMatch[1], 10);
        const reason = resultText.split("For this reason:")[1]?.trim();

        if (!reason) throw new Error("Explanation not found in GPT response.");

        return { score: larpScore, reason };
    } catch (error) {
        console.error("Error calling OpenAI API:", error);
        return null;
    }
};
const resultContainer = document.getElementById("result-container2");
// Display the result to the user
const displayResult = (result) => {

    if (result.score < 35 && result.score > 0) {
        result.class = 'green'
    } else if (result.score >= 35 && result.score < 80) {
        result.class = 'yellow'
    } else if (result.score >= 80) {
        result.class = 'red'
    }
    if (result) {
        resultContainer.innerHTML = `<strong>LARP score is</strong> <span class="${result.class}">  ${result.score - 10}/100</span><br><strong>For this reason:</strong> ${result.reason}`;
    } else {
        resultContainer.innerText = "An error occurred while analyzing the coin.";
    }
};


sendBtn.addEventListener("click", async () => {
    const introContainer = document.querySelector(".intro-container");
    const animationContainer = document.getElementById("animation-container");
    const resultContainer = document.getElementById("result-container2");

    if (introContainer) introContainer.style.display = "none"; // Hide intro section
    if (animationContainer) animationContainer.style.display = "block"; // Show animation container

    const steps = [
        { id: "step-1", progressId: "link-progress", duration: 1000 },
        { id: "step-2", progressId: "barometer-progress", duration: 1500 },
        { id: "step-3", progressId: "website-progress", duration: 2000 },
        { id: "step-4", progressId: "social-progress", duration: 2000 },
        { id: "step-5", progressId: "developer", duration: 1500 },
        { id: "step-6", progressId: "processing-progress", duration: 2500 },
    ];

    // Function to handle animation for each step
    const runStep = (index) => {
        if (resultContainer) resultContainer.style.display = "none";
        resultContainer.innerHTML = `<div class='loader'>
                                        <div class='circle'></div>
                                        <div class='circle'></div>
                                        <div class='circle'></div>
                                        <div class='circle'></div>
                                        <div class='circle'></div>
                                    </div>`; // Clear previous result
        return new Promise((resolve) => {
            if (index >= steps.length) {
                resolve(); // Resolve the promise when all steps are completed
                return;
            }

            const step = steps[index];
            const stepElement = document.getElementById(step.id);
            const progressElement = document.getElementById(step.progressId);

            if (stepElement && progressElement) {
                // Show the current step
                stepElement.style.display = "block";

                // Animate the progress bar
                setTimeout(() => {
                    progressElement.style.width = "100%";
                }, 100);

                // Wait for the animation to complete, then move to the next step
                setTimeout(() => {
                    stepElement.style.display = "none"; // Hide the current step
                    runStep(index + 1).then(resolve); // Move to the next step
                }, step.duration);
            } else {
                resolve(); // Resolve if the step element is missing
            }
        });

    };

    runStep(0);


    const coinUrl = document.getElementById("coin-link").value;
    if (!coinUrl) {
        alert("Please enter a coin URL!");
        animationContainer.style.display = "none";
        introContainer.style.display = "block";
        return;
    } else {
        document.querySelector("#send-button").disabled = true;
        await runStep(0); // Wait for animation to complete
        resultContainer.style.display = "block";
    }

    document.querySelector("#send-button").disabled = true;
    //resultContainer.innerText = "Analyzing... Please wait.";

    try {
        const coinId = extractCoinId(coinUrl);

        // Step 1: Check Firebase for existing analysis
        let firebaseAnalysis = await fetchFromFirebase(coinId);

        if (firebaseAnalysis) {
            // If data exists in Firebase, display it
            console.log("Analysis found in Firebase:", firebaseAnalysis);
            displayResult(firebaseAnalysis);
        } else {
            // Step 2: If no data, scrape details and generate new analysis
            console.log("No data found in Firebase. Proceeding with analysis.");
            const scrpData = await scrapePumpFunDetails(coinUrl);



            console.log("Scraped Data:", scrpData);

            // Generate new analysis using GPT API
            const analysis = await analyzeWithOpenAI(coinId, coinUrl, scrpData);

            if (analysis) {
                // Display and save new analysis
                displayResult(analysis);
                await saveToFirebase(coinId, analysis);
            } else {
                console.error("Analysis failed.");
                resultContainer.innerText = "Analysis failed. Please try again.";
            }
        }
    } catch (error) {
        console.error("Unexpected error:", error.message || error);
        resultContainer.innerText = "An error occurred while analyzing the coin.";
    }

    // Reset and re-enable the button

    resetAnimation();
    setTimeout(() => {
        document.querySelector("#send-button").disabled = false;
    }, limitInSeconds * 1000);
});




// Reset animation function
function resetAnimation() {
    // Reset progress bars
    document.querySelectorAll(".progress").forEach((progress) => {
        progress.style.width = "0";
    });

    // Hide all steps
    document.querySelectorAll(".step").forEach((step) => {
        step.style.display = "none";
    });

    // Hide result container
    const resultContainer = document.getElementById("result-container2");
    if (!resultContainer) resultContainer.style.display = "block";

    // Clear score and remove color classes
    const scoreElement = document.getElementById("larp-score");
    if (scoreElement) {
        scoreElement.innerText = "";
        scoreElement.classList.remove("green", "yellow", "red");
    }

    // Show the intro section again
    const introContainer = document.getElementById("intro-container");
    if (introContainer) introContainer.style.display = "block";
}


