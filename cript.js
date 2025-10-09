[33mcommit d09c7582d96930b2cc267a4a936c9954f5b8ff0c[m[33m ([m[1;36mHEAD[m[33m -> [m[1;32mmaster[m[33m, [m[1;31morigin/master[m[33m, [m[1;31morigin/HEAD[m[33m)[m
Author: Vauth <Sebastian.Vauth@thi.de>
Date:   Wed Jul 30 22:51:17 2025 +0200

     Improve navigation and authentication flow
    
     Navigation for Logged Out Users:
    - Hide search bar when user is not authenticated
    - Hide Home and Courses buttons for unauthenticated users
    - Only show Sign In and Sign Up buttons in navigation
    - Clean, minimal navigation for anonymous visitors
    
     Enhanced Authentication Flow:
    - Redirect to home page after successful login
    - Prevent authenticated users from accessing landing page
    - Sign out redirects to welcome page instead of home
    - Better post-authentication navigation handling
    
     Technical Improvements:
    - Added updateNavigationVisibility() method to AuthManager
    - Enhanced renderCurrentView() with better authentication checks
    - Improved sign-in/sign-out redirect logic
    - Proper navigation state on initial page load
    
     User Experience:
    - Clear separation between authenticated and unauthenticated UI
    - Intuitive navigation flow based on user state
    - No confusion about available features for different user types

 script.js | 21 [32m++++++++++++++++++++[m[31m-[m
 1 file changed, 20 insertions(+), 1 deletion(-)
