UPDATED: I have added an algorithm to adjust the movies displayed on the carousels and interest stack so that the movies appear to be shuffled properly across titles and genres. I also added a genre filter on the explore page's stack so that the user is able to go through a specific genre that they are interested in seeing. The previous shuffling issue is displayed in the github folder: changes.

My project is a card swipe movie application that helps users find new movies to watch. The application allows the user to go through a stack of movies, or search movies, and then add them to their library.

Setup Instructions: username: guest password: 123456

Technologies/Tools: I used Claude, Vercel, Supabase, and this guy's movie API database. https://www.omdbapi.com/

Bugs: Slow API database retrieval, some of the movies are not properly displayed from API (can show as flashing text or do not contain images).

Limitations: Cannot create new account without manually adding user login information on Vercel/supabase, Movie generation within genre is not entirely randomized within slideshows and card stack

What I Learned: I learned that Claude AI was capable of integrating multiple types of technologies on its own, and that we, the user only have to input the proper settings on our end such as Keys. I also learned that the microiterations indeed did help with debugging the issues as the tiny step by steps helped fix issues that could not be caught and fixed on the first try. A few of my troubleshooting issues had bugs that needed to be relayed to Claude multiple times before it was solved.
