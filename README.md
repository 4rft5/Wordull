# Wordull
A selfhosted Wordle Clone that uses the actual NYT word, import stats, and reminder notifications.

## About
Wordull is a simple clone of Wordle that takes design inspiration from the [2022 version of Wordle](https://archive.org/details/wordle-20220202) from before the New York Times bought it out.

## How it Works
Using the configurable `TZ` environment variable in Docker-Compose, the container gets the word of the day (YYYY-MM-DD) from the [NYTimes Wordle json](https://www.nytimes.com/svc/wordle/v2/2025-11-18.json) (example for Nov 19, 2025). This ensures that the word each day is the same as the original Wordle while keeping everything else local.

In terms of rules, Wordull is identical to Wordle. It has a list of words in json that can be entered, grey letters mean the letter is not in the puzzle, yellow is right letter, wrong place, and green is correct. You get six tries to enter the correct word, or you lose.

<details>
<summary>Disclaimer</summary>
I do not have any affiliation with or connection to The New York Times, The New York Times Company or Josh Wardle. This software is distributed completely free of charge and is not intended to confuse, mislead or otherwise trick the general public. The Wordle logo, name and namesake are owned by the New York Times.
</details>

## Features
* Configurable timezone to ensure that the word is updated at midnight each day (from the official NYTimes json).
* Import statistics from the original NYTimes Wordle in the Settings page (optional).
* Configurable notifications via [Apprise-API](https://github.com/caronc/apprise#supported-notifications) for reminders to do the puzzle if it has not been completed that day (optional).
* Hard Mode - Functions identical to Wordle hard mode, any revealed hints must be used in subsequent guesses.
* Statistics are saved in json in the `data/` folder and update with the guess distribution, amount of challenges played, win percentage, current and max streak.
* Share button to copy results of the Wordull to your clipboard to share.

## Installation
1. Download the docker-compose file from this repository
2. Configure with the Port and TZ of your choosing (default port is 2309)
3. Run `docker compose up -d`
4. Configure Settings
5. Enjoy!

## Contributions
I don't really see how more features can be added to this, but if you want to add something or clean up code, feel free to open a PR on this repo.

## Issues
I have not encountered any issues during my testing, but if you encounter an issue, you can open an issue here. Please provide logs from everything to help me better help you.
