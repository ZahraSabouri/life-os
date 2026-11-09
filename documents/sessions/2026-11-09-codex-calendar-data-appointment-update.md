# 2026-11-09 - Codex - Calendar data - Appointment update

## Goal
Update an existing appointment from Xar's confirmed phone call and report verified interview joining details in chat.

## What I did
- Updated the existing appointment and completed its existing call task through guarded server API writes.
- Verified the replacement location against the provider website and Google Maps.
- Read the live Outlook interview invitation after Xar completed sign-in. Reported the time and Teams link in chat.

## Files and commits
Documentation checkpoint `[calendar-data-cp5] Update existing appointment after GP call`. Private preview, snapshot, PostgreSQL dump, mutation journal and verification are in `.runtime/appointment-update-2026-11-09/`.

## How I checked it
Verified the custom dump signature before writes. Both API patches used If-Match. Exact readback confirmed only the two intended entries changed, with 276 entries before and after. Calendar readback contains the appointment once at the replacement time. Opened its Health detail and confirmed the displayed date, time and place. Read the live interview invitation including its joining link.

## Data touched
Two existing core entries updated. No new entries, migrations or direct database writes. Other core entries compared equal. Interview details were reported in chat.

## Problems and surprises
The provider's CRI branch has a postal site address on Glossop Terrace and a Google Maps pin on Newport Road. The official site plan confirms pedestrian access from Newport Road.

## Small decisions I made, and questions for Xar
Read the dictated time as 11:15 on 19 November. Marked the related call task done because Xar confirmed making the call. Used the provider's CRI branch name for the location.

## Next step
Use the corrected appointment and the live interview invitation. Development remains stage 7 CP5.
