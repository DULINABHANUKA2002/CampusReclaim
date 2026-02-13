# Software Project Report – TICT 3153

## 1. Project Overview
*   **Project Title:** CampusReclaim
*   **Prepared by:** [Insert Your Name]
*   **Department / Faculty:** [Insert Department Name]
*   **University Name:** [Insert University Name]
*   **Submission Date:** February 13, 2026

## 1.1 Project Description
**CampusReclaim** is a modern, web-based lost and found management system specifically designed to streamline the process of item recovery within university environments. In a bustling campus setting, students frequently lose essential items like ID cards, electronics, and study materials, while finders often struggle to locate the rightful owners.

The platform provides a centralized, secure, and intuitive portal where campus members can immediately report lost items or list found belongings. It features a real-time, searchable "Public Feed" that allows users to browse items by category and location. To ensure trust and security, the system incorporates a multi-role authentication system where administrators can moderate reports and monitor community activity. By replacing fragmented social media posts and physical notice boards with a structured digital ecosystem, **CampusReclaim** significantly increases the success rate of item recovery and fosters a stronger sense of community responsibility.

---

## 2. Objectives & Scope
### Objectives:
*   To bridge the communication gap between students who lose items and those who find them.
*   To provide a centralized, searchable database for campus-wide lost and found activity.
*   To automate the status tracking of items from "Active" to "Resolved."
*   To enhance campus security by providing admin oversight of all reported items.

### Scope:
*   **Functional Boundaries:** User authentication (registration/login), item reporting with image uploads, public dashboard with real-time searching, analytics for impact tracking, and an administrative portal for data management.
*   **Non-Functional Boundaries:** Responsive web design for mobile/desktop use, secure password hashing, and lightweight client-side routing for a seamless user experience.

---

## 3. Technology Stack
*   **Frontend:** Vanilla HTML5, CSS3 (Modern Glassmorphism Design), Vanilla JavaScript (Custom SPA Router).
*   **Backend:** PHP (Raw PHP for API development).
*   **Database:** MySQL (Relational Database Management).
*   **Resources Used:** 
    *   **FontAwesome 6.4:** For high-quality vector icons.
    *   **Google Fonts (Outfit):** For modern, readable typography.
    *   **XAMPP:** Local development environment for Apache and MySQL.

---

## 4. Features & Functionalities

| Feature | Description |
| :--- | :--- |
| **Secure Authentication** | Multi-role login system (User/Admin) with session-based security. |
| **Public Feed** | A real-time searchable dashboard where users can view all lost and found items. |
| **Item Reporting** | Integrated form supporting image uploads, categorization (Electronics, Documents, etc.), and location tagging. |
| **My Items Portal** | A personalized dashboard for users to manage their own reports and mark them as resolved. |
| **Analytics Dashboard** | Visual representation of "Total Ecosystem Reports" vs. "Resolved Cases" to showcase project impact. |
| **Admin Control Center** | Dedicated view for administrators to manage user accounts and moderate reported content. |

---

## 5. UI/UX Screenshots
*(Note: Please attach the actual screenshots of your running application to these sections)*

1.  **Login Page:** Featuring a sleek glassmorphic card design and role-based toggle.
2.  **Public Dashboard:** Showing the "Report. Recover. Reclaim." hero section and the item grid.
3.  **Reporting Form:** The interface for uploading photos and entering item details.
4.  **Profile Page:** Displaying user activity history and bio.
5.  **Admin Portal:** Showing system-wide stats and user management table.

---

## 6. Challenges & Resolutions

| Challenge | Resolution |
| :--- | :--- |
| **SPA Feel without Frameworks** | Developed a custom JavaScript router using hash fragments (`#`) to switch views without page reloads. |
| **Secure File Uploads** | Implemented server-side validation and unique hashing for filenames to prevent overwrites and security vulnerabilities. |
| **Session Security** | Implemented strict PHP session checks to ensure users can only modify their own items. |
| **SQL Injection Prevention** | Utilized PDO Prepared Statements for all database interactions to ensure robust security. |
| **Responsive Design** | Adopted a Mobile-First approach with CSS Flexbox to maintain accessibility on small screens. |
| **State Management** | Used a centralized JavaScript state object to synchronize the UI without full page reloads. |
| **Database Connectivity** | Utilized a centralized `db_connect.php` with robust error handling for MySQL interactions. |

---

## 7. Conclusion
The **CampusReclaim** project successfully addresses the critical need for a structured and reliable lost and found system within a university environment. By transitioning from informal, fragmented reporting methods to a centralized digital platform, we have significantly streamlined the recovery process for students and staff alike. Throughout the development of this full-stack application, key technical challenges—such as multi-role authentication, responsive UI design using Glassmorphism, and secure file handling—were successfully overcome. This project not only demonstrates the practical application of PHP, MySQL, and modern JavaScript but also highlights the importance of user-centric design in solving community-level problems. Ultimately, CampusReclaim fosters a more connected and responsible campus culture, providing a scalable foundation for future improvements in campus management systems.

---

## 8. Future Enhancements
*   **Real-time Notifications:** Integration with WebSocket or push notification services to alert users the moment a matching item is reported.
*   **AI-Powered Matching:** Utilizing machine learning and image recognition algorithms to automatically suggest potential matches between "Lost" and "Found" records based on visual features.
*   **GIS & Interactive Mapping:** Implementation of a campus map interface where users can pin the exact location where an item was lost or found for better spatial awareness.
*   **Reward & Gamification System:** A system to acknowledge and reward honest finders with campus credits or digital badges to encourage community participation.
*   **Multi-University Scaling:** Expanding the database architecture to support multiple campuses or universities within a single, unified network.
*   **In-App Messaging:** A secure, anonymized chat system that allows finders and owners to communicate and arrange handovers without sharing personal contact details.
*   **Email Alerts:** Sending automated emails to users when an item matching their "Lost" description is posted.
