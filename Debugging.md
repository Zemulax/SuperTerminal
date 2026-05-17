1. Open SuperTerminal
   -> Observation: on start UI does not accomodate all UI elements such as Tools.
   -> Problem: tools overlap each other
   -> suggestion: replace "checked" or "not checked" with icons.

2. Open a real project folder
   -> Observation: requires project path pasted.
   -> Problem: user must find the folder manually and copy-paste the path
   -> Suggestion: implement a file explorer or folder picker to select the project folder.

3. Inspect file explorer
   -> Observation: works fine
   -> Problem: none
   -> Suggestion: none

4. Check tool statuses
   -> Observation: checkk works fine. just need to improve reporting UI on missing and available tools.
   -> Problem: reporting text is cumbersome and taking unnecessary space.
   -> Suggestion: use icons or only display available tools. and maybe an install tools section where tools are constantly published for user to access.

5. Configure Generic CLI to something safe first
   -> Observation: Maybe we dont need a generic CLI right now.
   -> Problem: Not necessary now. maybe later.
   -> Suggestion: remove

6. Launch normal shell
   -> Observation: works fine.
   -> Problem: CMD jumps straight to C:Windows which could be dangerous if user is not careful.
   -> Suggestion: set default path to user home or current project folder. Add a bit of styling to the terminal to make it immersive and distinct from a normal terminal. maybe even add a welcome message with some tips on how to use SuperTerminal. Also maybe make the terminal active by default regardless if a project is loaded or not. superterminal could be the default terminal which can open all other terminals by name eg openclaude, codex etc. since we would need to wire windows termianl behing it, maybe it could be an unnecessary overhead?

7. Launch a configured tool
   -> Observation:
   -> Problem:
   -> Suggestion:

8. Generate context
   -> Observation: works well
   -> Problem: none
   -> Suggestion: none

9. Inject context into terminal
   -> Observation: works well
   -> Problem: none
   -> Suggestion: none

10. Interact with the tool
    -> Observation: seems to work fine
    -> Problem: none
    -> Suggestion: none

11. Stop session
    -> Observation: session can be stopped.
    -> Problem: none
    -> Suggestion: none

12. Inspect session history/transcript
    -> Observation: seems to work fine
    -> Problem: recent sessions says: Invalid Date NaNm NaNs
    -> Suggestion: fix the date issue in Session History: reccent Session

13. Try missing-tool install flow
    -> Observation: Installation doesnt seem to work.
    -> Problem: The latest install result says: Unable to start install command: program not found Exit code: null.
    -> Suggestion: I dont know where superterminal scans for toos but most tools are usually saved in C:users/user>, whic is exactly where the windows commandline points to when launched.

14. Note friction, confusion, bugs, and UX gaps
    -> Observation:
    -> Problem:
    -> Suggestion:
