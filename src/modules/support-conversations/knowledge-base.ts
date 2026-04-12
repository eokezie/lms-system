/**
 * Infinix Tech LMS — Support Knowledge Base
 *
 * This file is the single source of truth that the AI support agent reads at
 * runtime. It is sent as a cached system block to Anthropic so subsequent
 * turns in the same conversation reuse it at ~10% cost.
 *
 * Edits here take effect on the very next bot reply — no DB writes, no
 * embeddings, no rebuild needed.
 *
 * Article IDs (KB-XXXX) are stable. The bot is instructed to cite them when
 * an answer maps cleanly to a specific article.
 */

export const SUPPORT_KNOWLEDGE_BASE = `# Infinix Tech LMS — Support Knowledge Base
Version 1.0 — April 2026

This is the canonical FAQ + concept reference. Use it to answer student questions about the platform, the courses, and the technology covered in those courses. When an article maps cleanly to a question, cite its ID like "(KB-0006)" so we can audit which article was used.

================================================================================
PLATFORM & ACCOUNT
================================================================================

[KB-0001] Registration | High
Q: How do I create an account on the ITC SPL platform?
Steps: 1) Visit the portal and click "Sign Up". 2) Enter full name, email, and password (min 8 chars, at least one uppercase + one number). 3) Agree to Terms of Service and Privacy Policy (you must click both links before the checkbox enables). 4) Click "Sign Up". 5) Check email for a 6-digit verification code. 6) Enter the code on the verification page. Once verified, sign in and start browsing courses.

[KB-0002] Registration | High
Q: I did not receive my email verification code.
Check spam/junk; confirm the email you registered with; wait a few minutes (delivery can be delayed); after 10 minutes try registering again with the same email. If it still does not arrive, escalate to support@infinixtech.com.

[KB-0003] Login | High
Q: I forgot my password.
1) Sign In page → "Forgot Password". 2) Enter the email on your account. 3) Check email for a 6-digit recovery code. 4) Enter the code on the recovery page. 5) Set a new password (min 6 chars). 6) Sign in. The recovery code expires; request a new one if needed.

[KB-0004] Login | High
Q: Why can't I log in?
Common causes: wrong password (use Forgot Password); unverified email (check inbox for the verification code); account suspended (escalate); browser issues (clear cache/cookies, try another browser); rate limiting (after 5 failed attempts the account is locked for 30 minutes — wait and try again).

[KB-0005] Courses | Medium
Q: How do I browse and find courses?
From the dashboard or course catalogue, browse cards (thumbnails, titles, ratings, prices). Use filters for Category, Level (Beginner/Intermediate/Advanced), Price Range, Duration, Rating. Use the search bar for keywords. Click any card for the detail page (curriculum, instructor info, reviews). Most courses have free preview lessons — look for unlocked lessons in the curriculum.

[KB-0006] Enrollment | High
Q: How do I enrol in a course?
1) Open the course detail page. 2) Click "Enrol Now" / "Buy Now". 3) For paid courses you go to the checkout page. 4) Pay via Stripe (all major credit/debit cards). 5) Receive a confirmation email + receipt. 6) Click "Start Learning" or open the course later from the dashboard. Free courses grant access immediately.

[KB-0007] Payments | Medium
Q: What payment methods do you accept?
We use Stripe: Visa, Mastercard, Amex and other major credit/debit cards, plus Apple Pay and Google Pay where available. Card details are never stored on our servers. You receive an email receipt for every purchase.

[KB-0008] Payments | Medium
Q: Can I get a refund?
Refund requests should be submitted within 14 days of purchase. Email support@infinixtech.com with your order details. Refunds go back to the original payment method, processing 5–10 business days. Courses with more than 30% completion may not be eligible for a full refund. Always escalate refund requests to a human — the bot cannot process them.

[KB-0009] Payments | Medium
Q: Do you offer discount codes or promotions?
Yes — look for discount badges in the catalogue, enter promo codes in the discount field at checkout, and follow social media for flash sale announcements. Some courses apply first-purchase discounts automatically. Discount codes have expiry dates and usage limits.

[KB-0010] Progress | Medium
Q: How is my learning progress tracked?
Progress is automatic. A lesson is marked complete after watching ≥90% of its video. Course progress = completed lessons / total lessons × 100%. The dashboard shows overall progress, per-course progress bars, learning streaks, and total hours. Click "Continue Learning" to resume from your last position. Streaks count consecutive active days. Progress syncs in real time across devices.

[KB-0011] Progress | Medium
Q: Can I resume a video from where I left off?
Yes — playback position is saved automatically. When you return to a lesson it resumes at the exact timestamp; your place is highlighted in the curriculum sidebar; "Continue Learning" on the dashboard jumps you straight back. Works across devices.

[KB-0012] Certificates | High
Q: How do I get a certificate after completing a course?
1) Complete every lesson in every module (≥90% of each video). 2) Pass all module quizzes (default passing grade 70%). 3) For the flagship Cybersecurity course, submit and pass the capstone project in Module 16. 4) The certificate is then auto-generated. 5) Download as PDF from the dashboard or the course completion page. The certificate includes your name, course title, completion date, unique certificate ID, instructor name, ITC branding, and a QR code for verification.

[KB-0013] Certificates | Medium
Q: Can I verify or share my certificate?
Yes — every certificate has a public verification system. QR code scans to the public verification page; the URL format is /verify/certificate/{certificate-id}; share buttons exist for LinkedIn and Twitter; the verification link can be copied to share anywhere. Anyone with the link or QR can confirm authenticity.

[KB-0014] Quizzes | High
Q: How do quizzes work?
Quizzes sit at the end of each module. Types: multiple choice (single answer), multiple select, true/false. Default passing grade is 70% (configurable per quiz). Retakes are unlimited. After submission you see your score, per-question correct/incorrect breakdown, the correct answers, and time taken. You must pass the module quiz to unlock the next module. The final module may use a capstone project instead of a quiz. Every attempt is recorded with timestamp + score.

[KB-0015] Quizzes | Medium
Q: I failed a quiz. Can I retake it?
Yes — unlimited retakes. Review your results (the system shows the questions you got wrong and the correct answers), revisit the module lessons, then click "Retake Quiz". Each attempt is recorded separately. Tip: read the reasoning shown after each question — it explains why the correct answer is right.

[KB-0016] Video | Medium
Q: What video quality options are available?
Adaptive bitrate streaming. Auto quality (recommended) adjusts to your connection. Manual selection: 360p, 480p, 720p, 1080p. Playback speed: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x. Full-screen mode and Picture-in-Picture supported. Keyboard shortcuts: Space (play/pause), arrows (seek). Closed captions appear on lessons where subtitles have been uploaded. Videos are hosted on Mux.

[KB-0017] Forums | Medium
Q: How do I participate in course discussions?
Each course has a Discussions tab. Browse threads or search for topics. Click "New Post" to start one — pick the relevant lesson, add a title and message. Reply by typing in the reply box and clicking Send. Upvote helpful posts; instructors mark "Best Answer". Etiquette: be respectful, stay on topic, do not share quiz answers. Instructors and admins monitor and respond.

[KB-0018] Profile | Low
Q: How do I update my profile information?
Avatar in the top-right → Profile. You can update full name, profile photo, and bio. To change your password, go to Settings → Security. Your profile page shows learning stats: courses completed, total hours, quizzes passed, certificates earned.

[KB-0019] Account | Low
Q: How do I change my notification preferences?
Avatar → Account Settings → Notifications & Privacy. Toggle Email and App on/off for each type: Course updates, Replies to your posts, Account updates, System alerts. Changes save automatically.

[KB-0020] Account | Medium
Q: Is my data secure on the platform?
Yes. Data is encrypted in transit (TLS 1.3) and at rest. Auth uses JWT with automatic token refresh. Passwords are hashed (never stored plaintext). Payments are processed via Stripe (PCI DSS compliant) — we never store card details. Course videos use signed URLs and DRM to prevent unauthorised downloads. Role-based access control ensures you only see your own data.

[KB-0021] Career Paths | Medium
Q: What are Career Paths and how do they work?
Career Paths are curated sequences of courses designed to take you from beginner to job-ready in a specific field. Each path includes multiple courses in a recommended order. Paths show estimated total duration, skill level, and number of courses. Some paths offer an industry-recognised certificate on completion. Current paths cover Cybersecurity, Data Analysis, AI/Machine Learning, and Linux/DevOps.

================================================================================
CYBERSECURITY KNOWLEDGE BASE
================================================================================

[KB-0022] Getting Started | High
Q: What will I learn in the Cybersecurity course?
A ~15-hour, 16-module programme. Modules: 1 Introduction to Cybersecurity (threat landscape, CIA triad, terminology); 2 Network Fundamentals (TCP/IP, OSI, protocols); 3 Network Security (firewalls, IDS/IPS, VPNs, segmentation); 4 OS Security (hardening Windows + Linux); 5 Cryptography (symmetric/asymmetric, hashing, PKI, certificates); 6 Identity & Access Management (auth, MFA, SSO); 7 Web App Security (OWASP Top 10, SQLi, XSS, CSRF); 8 Cloud Security (shared responsibility, AWS/Azure basics); 9 Threat Intelligence (IOCs, MITRE ATT&CK); 10 Vulnerability Management; 11 Incident Response; 12 Security Operations (SIEM, SOC); 13 Compliance & Governance (GDPR, ISO 27001, NIST); 14 Ethical Hacking (pentesting); 15 Digital Forensics; 16 Capstone Project. Each module has video lessons, hands-on exercises, and a quiz.

[KB-0023] Getting Started | High
Q: Do I need any prior experience to take the Cybersecurity course?
No prior cybersecurity experience required. Recommended: basic computer literacy and a web browser. Helpful but optional: basic networking (IP addresses, Wi-Fi). Not required: programming experience (Module 14 introduces basic scripting). The course builds progressively from foundational concepts; each module assumes you completed the previous one.

[KB-0024] Concepts | Medium
Q: What is the CIA Triad?
The foundational model for information security. Confidentiality: information only accessible to authorised individuals (encryption, access controls, classification). Integrity: data is accurate, complete, and untampered (hashing, digital signatures, version control). Availability: systems and data are accessible when needed (redundancy, backups, DDoS protection). Every security control maps back to one of these. Covered in Module 1.

[KB-0025] Concepts | Medium
Q: What is the OWASP Top 10?
The most critical web application security risks per OWASP. 1 Broken Access Control. 2 Cryptographic Failures. 3 Injection (SQL/NoSQL/OS command). 4 Insecure Design. 5 Security Misconfiguration. 6 Vulnerable Components. 7 Authentication Failures. 8 Software & Data Integrity Failures. 9 Security Logging & Monitoring Failures. 10 Server-Side Request Forgery (SSRF). Covered in Module 7.

[KB-0026] Concepts | Medium
Q: Vulnerability vs threat vs risk?
Vulnerability: a weakness that could be exploited (unpatched server, weak password policy, open port). Threat: any potential cause of harm (hacker, malware, natural disaster, insider). Risk: the likelihood a threat will exploit a vulnerability × impact. Risk = Threat × Vulnerability × Impact. Example: an unpatched web server (vulnerability) targeted by an attacker (threat) → data breach (risk).

[KB-0027] Concepts | Medium
Q: What is a firewall and how does it work?
A network security device (hardware or software) that monitors/controls traffic against predetermined rules. Types: packet-filtering (inspects individual packets), stateful inspection (tracks active connections), application-layer / WAF (inspects HTTP/DNS), next-generation (NGFW — combines firewall + IPS + DPI). Default policy is typically "deny all" with explicit allow rules. Module 3.

[KB-0028] Concepts | Medium
Q: What is encryption and why is it important?
Converts plaintext to ciphertext using an algorithm + key. Symmetric (AES, DES): same key encrypts/decrypts, fast, used for bulk data, challenge is key distribution. Asymmetric (RSA, ECC): public key encrypts, private key decrypts, slower but solves key distribution, used for key exchange and digital signatures. Protects data in transit (HTTPS/TLS), at rest (disk encryption), enables authentication (certificates), ensures integrity (hashing), and is required by GDPR/PCI DSS. Module 5.

[KB-0029] Concepts | High
Q: What is phishing and how can I protect myself?
A social engineering attack where attackers impersonate trusted entities to steal information. Types: email phishing (mass), spear phishing (targeted), whaling (executives), smishing (SMS), vishing (voice). Protection: check the sender's actual email address (not just display name); hover over links before clicking; never enter credentials on a page you reached via email link; enable MFA; report suspicious emails to IT; use anti-phishing email filters. Module 1 + Module 9.

[KB-0030] Concepts | Medium
Q: What is a SIEM?
Security Information and Event Management — aggregates and analyses security data across the org's IT estate. Functions: log collection, correlation, alerting, dashboards, compliance retention. Popular tools: Splunk, Microsoft Sentinel, IBM QRadar, Elastic SIEM. SOC analysts use SIEM to monitor, investigate, and respond. Module 12.

[KB-0031] Careers | High
Q: What career paths are available in cybersecurity?
Entry-level: Security/SOC Analyst, IT Security Administrator, Security Support Engineer, Junior Pen Tester. Mid-level: Incident Response Analyst, Vulnerability Analyst, Security Engineer, Compliance Analyst. Senior: Security Architect, Pen Testing Lead, Threat Intelligence Analyst, CISO. Useful certs: CompTIA Security+, CEH, CISSP, OSCP, CISM. The ITC course prepares you for entry-level roles and builds foundations for those certs.

[KB-0032] Concepts | Medium
Q: What is the MITRE ATT&CK framework?
Adversarial Tactics, Techniques, and Common Knowledge — a global knowledge base of adversary behaviour from real-world observation. Tactics = the why (Initial Access, Execution, Persistence, Exfiltration). Techniques = the how (Phishing, PowerShell, Registry Run Keys). Sub-techniques = more specific variants. Procedures = real-world implementations by threat groups. Used for threat hunting, red teaming, gap analysis, and IR mapping. Module 9.

================================================================================
DATA ANALYSIS KNOWLEDGE BASE
================================================================================

[KB-0033] Getting Started | High
Q: What will I learn in the Data Analysis course?
The full analytics workflow. Foundations: what data analysis is, types of data (structured/unstructured/quantitative/qualitative), the lifecycle (Define → Collect → Clean → Analyse → Visualise → Report). Tools: Excel/Sheets, SQL, Python (pandas, matplotlib), Power BI/Tableau. Core skills: data cleaning, EDA, statistics (mean/median/mode/SD/correlation), visualisation best practices, dashboard design, storytelling, reporting. Includes hands-on projects on real datasets.

[KB-0034] Getting Started | High
Q: What tools do I need for the Data Analysis course?
Required (free): Excel or Google Sheets; SQL via our browser-based playground (no install); Python via Google Colab. Recommended (optional): Power BI Desktop (Windows free download), Tableau Public, VS Code if you want a local Python env. All datasets and exercise files are downloadable inside lessons. No paid software is required.

[KB-0035] Concepts | Medium
Q: Descriptive vs diagnostic vs predictive vs prescriptive analytics?
Descriptive — "What happened?" Historical summaries (SQL, pivot tables, dashboards). Diagnostic — "Why did it happen?" Drill-down, correlation, root cause. Predictive — "What will happen?" Regression, time series, ML. Prescriptive — "What should we do?" Optimisation, simulation, decision trees. The course primarily covers descriptive and diagnostic with an intro to predictive concepts.

[KB-0036] Concepts | Medium
Q: What is data cleaning and why does it matter?
Identifying and correcting errors, inconsistencies, and inaccuracies before analysis. Common issues: missing values, duplicates, inconsistent formatting (dates, casing), invalid values, outliers, inconsistent categories ("UK" vs "United Kingdom" vs "GB"). "Garbage in, garbage out" — analysts spend 60–80% of their time on cleaning. Tools: Power Query, pandas, SQL, Excel Find & Replace.

[KB-0037] Concepts | High
Q: What is SQL and why is it essential for data analysis?
Structured Query Language — the standard for relational databases. Key operations: SELECT, WHERE, JOIN, GROUP BY, ORDER BY, subqueries/CTEs, window functions (running totals, rankings, moving averages). Most business data lives in relational DBs and SQL is required on almost every data analyst job posting. Dedicated SQL module with hands-on exercises.

[KB-0038] Concepts | Medium
Q: How do I create effective data visualisations?
Pick the right chart: bar/column for category comparisons, line for trends, pie/donut sparingly (≤5–6 segments) for parts of a whole, scatter for relationships, heatmap for two-dimensional patterns, KPI cards for single metrics. Best practices: start with the question; remove chart junk (gridlines, borders, 3D); use colour intentionally to highlight insights; label axes + units clearly; use consistent scales across related charts; tell a story; use colour-blind-friendly palettes.

[KB-0039] Careers | High
Q: What jobs can I get with data analysis skills?
Entry: Data Analyst, Junior Business Analyst, Reporting Analyst, Operations Analyst. Mid: Senior Data Analyst, BI Developer, Product Analyst, Marketing Analyst. Adjacent: Data Engineer, Data Scientist, Financial Analyst, Healthcare Analyst. Employers look for Excel, SQL, Python or R, Power BI/Tableau, statistical thinking, communication, business acumen.

================================================================================
AI & MACHINE LEARNING KNOWLEDGE BASE
================================================================================

[KB-0040] Getting Started | High
Q: What will I learn in the AI/ML course?
Foundations (definitions; ML pipeline data → features → model → evaluation → deployment; supervised/unsupervised/reinforcement). Core algorithms: linear/logistic regression, decision trees, random forests, k-means/hierarchical clustering, SVM, neural network basics, NLP fundamentals. Practical: Python ML (scikit-learn, TensorFlow/Keras basics), preprocessing/feature engineering, evaluation metrics (accuracy, precision, recall, F1, ROC/AUC), overfitting/underfitting/regularisation, AI ethics (bias, fairness, transparency). Uses Google Colab — no GPU required.

[KB-0041] Getting Started | High
Q: Do I need to know programming before taking the AI/ML course?
Basic Python is recommended but not strictly required. Minimum recommended: variables/types, loops, conditionals, functions, lists, dictionaries. Helpful but taught: NumPy, pandas, matplotlib/seaborn. Not required: OOP, web development, other languages. The first modules include a Python refresher. Complete beginners should consider doing the Data Analysis course first (it introduces Python fundamentals).

[KB-0042] Concepts | High
Q: What is the difference between AI, ML, and Deep Learning?
Nested concepts. AI is the broadest term — any system performing tasks that need human intelligence (reasoning, learning, perception). ML is a subset of AI — systems that learn patterns from data without being explicitly programmed. Deep Learning is a subset of ML — neural networks with many layers, excels at images, NLP, speech. Analogy: AI = the ambition, ML = the approach, DL = a powerful technique within that approach.

[KB-0043] Concepts | Medium
Q: Supervised vs unsupervised learning?
Supervised: labelled data (input-output pairs). Classification (spam/not spam, cat/dog) or Regression (price, temperature). Examples: linear regression, decision trees, random forests, SVM, neural networks. Unsupervised: unlabelled data — discovers structure. Clustering (customer segments), dimensionality reduction (PCA), association rules. Examples: k-means, hierarchical clustering, DBSCAN, PCA. Also Reinforcement Learning — trial and error with rewards/penalties (game AI, robotics).

[KB-0044] Concepts | Medium
Q: What is overfitting and how do I prevent it?
Overfitting = model learns the training data too well (including noise) and performs poorly on new data. Signs: very high training accuracy, low test accuracy; overly complex decision boundaries. Prevention: train/test split (80/20 or 70/30); cross-validation; regularisation (L1/L2); simpler models; more data; dropout (NNs); early stopping when validation degrades.

[KB-0045] Concepts | Medium
Q: Key metrics for evaluating ML models?
Classification: Accuracy (correct/total — misleading for imbalanced classes); Precision = TP/(TP+FP) "of those predicted positive, how many were correct?"; Recall = TP/(TP+FN) "of all actual positives, how many did we find?"; F1 = harmonic mean of precision and recall; ROC/AUC for class separation across thresholds; Confusion matrix for the breakdown. Regression: MAE, MSE/RMSE (penalises large errors more), R² (variance explained 0–1).

[KB-0046] Concepts | Medium
Q: What is a neural network and how does it work?
Computing system inspired by biological neural networks. Structure: input layer (one neuron per feature), hidden layers (weighted sum + activation), output layer (prediction). Learning: forward pass produces a prediction; loss function compares to actual; backpropagation calculates each weight's contribution to the error; gradient descent updates weights; repeat for many epochs. Key concepts: activation functions (ReLU, sigmoid, softmax), learning rate, batch size, epochs, optimisers (Adam, SGD). Hands-on with TensorFlow/Keras.

[KB-0047] Ethics | High
Q: What ethical concerns in AI does the course cover?
Concerns: bias and fairness; transparency (black-box models); privacy (training-data exposure); job displacement; deepfakes/misinformation; accountability when an AI causes harm. The course covers identifying and measuring bias, fairness techniques (resampling, bias-aware algorithms, fairness metrics), Explainable AI (SHAP, LIME, feature importance), responsible AI frameworks (EU AI Act, NIST AI RMF), and best practices (model cards, human oversight, impact assessments). Ethics is woven throughout the course, not a standalone module.

================================================================================
LINUX OS & DEVOPS KNOWLEDGE BASE
================================================================================

[KB-0048] Getting Started | High
Q: What will I learn in the Linux OS / DevOps course?
Linux fundamentals: distros (Ubuntu, CentOS, RHEL); command line; users/groups/permissions (chmod, chown); package management (apt, yum/dnf); processes (ps, top, kill, systemctl); Bash scripting; networking (ifconfig/ip, netstat, ssh, scp); filesystem and disk management. DevOps practices: CI/CD culture; Git + GitHub; Docker; Kubernetes basics; Terraform intro; CI/CD pipelines (GitHub Actions); monitoring/logging (Prometheus, Grafana concepts); cloud fundamentals (AWS/Azure). Hands-on labs in real Linux environments.

[KB-0049] Getting Started | High
Q: Do I need prior experience with Linux or DevOps?
No. Recommended: basic computer literacy. Helpful: familiarity with a terminal. Not required: previous Linux experience, programming, cloud certs. The course starts from "how do I open a terminal" and builds up. Lab environments are provided so no local Linux install needed initially.

[KB-0050] Concepts | High
Q: What are the most important Linux commands every beginner should know?
Navigation/files: pwd, ls (ls -la), cd (cd .., cd ~), mkdir, cp, mv, rm (rm -r), cat/less/head/tail. Permissions/users: chmod, chown, sudo. System: ps aux, top/htop, systemctl, df -h, free -h. Networking: ssh, curl/wget, ping. Covered in the first few modules with hands-on practice.

[KB-0051] Concepts | High
Q: What is Docker and why should I learn it?
A platform for building, shipping, and running applications in containers. A container packages an application with all dependencies into a single portable unit that runs consistently anywhere. Key concepts: Image (blueprint), Container (running instance), Dockerfile (build instructions), Docker Hub (public registry), docker-compose (multi-container apps). Why learn it: eliminates "works on my machine"; standard in modern DevOps; required for Kubernetes; speeds up dev/test/deploy; required for most DevOps job postings.

[KB-0052] Concepts | Medium
Q: What is CI/CD and why is it important?
Continuous Integration: developers merge frequently, each merge triggers automated builds + tests, catching bugs early. Continuous Delivery: code that passes CI is auto-prepared for release; production deploy needs manual approval. Continuous Deployment: every change that passes all stages is auto-deployed to production. Why: cuts time from commit to prod from days/weeks to minutes/hours, catches bugs early, reduces deployment risk via small frequent releases. Tools: GitHub Actions, GitLab CI, Jenkins, CircleCI, Azure DevOps. Course covers GitHub Actions.

[KB-0053] Concepts | Medium
Q: What is Infrastructure as Code (IaC)?
Managing/provisioning infrastructure via machine-readable config files instead of manual processes. Principles: declarative (define desired end state), version-controlled (in Git), reproducible, idempotent. Tools: Terraform (multi-cloud, HCL), AWS CloudFormation (YAML/JSON), Ansible (config management, agentless), Pulumi (general-purpose languages). Benefits: eliminate manual errors, identical dev/staging/prod, audit trail of changes, disaster recovery from code. Course introduces Terraform.

[KB-0054] Concepts | Medium
Q: What is Kubernetes and how does it relate to Docker?
Open-source container orchestration platform that automates deploying, scaling, and managing containerised apps. Docker creates and runs individual containers; Kubernetes manages hundreds/thousands across multiple machines. Key concepts: Pod (smallest deployable unit), Service (network exposure + load balancing), Deployment (desired state + rolling updates), Namespace (logical isolation), ConfigMap/Secret (config + secrets), Ingress (HTTP routing). Solves auto-scaling, self-healing, load balancing, rolling updates with zero downtime, service discovery. Course uses minikube for hands-on labs.

[KB-0055] Careers | High
Q: What career opportunities exist in Linux/DevOps?
Entry: Junior Linux Sysadmin, Junior DevOps Engineer, Cloud Support Engineer, Junior SRE. Mid: DevOps Engineer, Platform Engineer, Cloud Engineer (AWS/Azure/GCP), Infrastructure Engineer. Senior: Senior DevOps, SRE, Cloud Architect, Director of Infrastructure. Skills employers want: Linux admin, Docker, Kubernetes, CI/CD, Terraform/Ansible, Git, Python/Bash, AWS/Azure, monitoring. Certs: LFCS, AWS Solutions Architect, CKA, HashiCorp Terraform Associate.

================================================================================
TECHNICAL SUPPORT & TROUBLESHOOTING
================================================================================

[KB-0056] Video Issues | High
Q: My video is buffering or won't play.
Try: 1) Check internet (min 5 Mbps for 720p, 10 Mbps for 1080p). 2) Lower the video quality in the player (480p or 360p). 3) Clear browser cache (Settings → Clear browsing data → Cached images and files). 4) Try a different browser (Chrome, Firefox, Edge fully supported). 5) Disable ad blockers/VPNs. 6) Update browser. 7) Try incognito/private mode. If it persists, escalate with the course name, lesson title, and browser/OS.

[KB-0057] Video Issues | Medium
Q: Can I download course videos for offline viewing?
Not currently — to protect instructor IP and ensure content security. You can download supplementary materials (PDFs, slides, lab files), resume videos when you're back online, and use lower quality (360p) on slow connections. Offline viewing is being explored for future releases.

[KB-0058] Browser | Medium
Q: Which browsers are supported?
Fully supported: Chrome, Firefox, Edge (latest 2 versions each). Supported with minor limitations: Safari (latest macOS/iOS). Not supported: Internet Explorer, Opera Mini. Mobile: fully responsive; Chrome (Android) and Safari (iOS) recommended. The platform works as a Progressive Web App — no native app required. Keep your browser up to date.

[KB-0059] Account Issues | High
Q: I can't access a course I purchased.
1) Verify payment (check email for the Stripe receipt). 2) Check the dashboard "My Courses" / "Enrolled Courses". 3) Log out and back in to refresh session. 4) Clear browser cache. 5) Confirm you're logged into the same account you used to purchase. If still blocked, escalate to support@infinixtech.com with your registered email, the course name, and the payment receipt or transaction ID. Access issues are resolved within 24 hours.

[KB-0060] Account Issues | Low
Q: How do I delete my account?
Email support@infinixtech.com from your registered email with subject "Account Deletion Request" plus your full name and registered email. Deletion is permanent — all course progress, certificates, and enrollment data will be removed; active subscriptions are cancelled; processing is within 30 days per Privacy Policy and GDPR. To take a break instead, request account deactivation. Always escalate deletion requests to a human.

[KB-0061] Platform | Medium
Q: Is the platform accessible on mobile devices?
Yes — fully responsive. Chrome (Android) and Safari (iOS) are supported. Add to home screen for a Progressive Web App experience. Full video controls (quality, playback speed) work on mobile. All quiz types work on touch. Tips: landscape for video, download PDFs over Wi-Fi, use headphones in public.

[KB-0062] Platform | Medium
Q: What should I do if I encounter a bug or error?
1) Screenshot the error or unexpected behaviour. 2) Note page, action, URL. 3) Try refresh, clear cache, another browser. 4) Report it via support@infinixtech.com with description, steps to reproduce, screenshots, browser/OS, and your email — or use the "Need Help?" button at the bottom-right. We acknowledge bug reports within 24 hours and resolve critical issues within 48 hours.

[KB-0063] AI Chatbot | High
Q: What can the AI chatbot help me with?
Platform questions (account, registration, enrollment, payment queries, progress, certificates, troubleshooting). Course recommendations (suggestions, career path guidance, prerequisite advice). Learning support (explaining course concepts in cybersecurity, data analysis, AI/ML, Linux/DevOps; pointing you to relevant lessons). Limitations: cannot process payments or change account settings; for complex account issues request a human agent; the chatbot provides general guidance, not personalised academic assessment. Say "speak to a human agent" to be transferred.

[KB-0064] AI Chatbot | High
Q: How do I speak to a human support agent?
From the chatbot, type any of: "Speak to a human agent", "Real person", "Live agent", "Escalate". The system transfers you. Or email support@infinixtech.com directly (response within 1 business day). Or use the Need Help modal → "Email us" or "Make a suggestion". Support hours: Monday–Friday, 9am–6pm GMT.
`;
