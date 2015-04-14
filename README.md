

Show a schedule on the screen....

... intended to help kids follow a routing in the morning.

Hence *GET GOING!*

The main use case is for a parent to bring up the GetGoing page
on the living room flat screen (we've all got them right? And they're
all attached the internet now?) Or you can use a stand to prop
up a tablet.

When the page loads, you'll need to login. When you hit <enter> or
the login button, your last saved time schedule will load and display.
(And you shouldn't have to login again for a week).

To edit/start the process, it's best to get to a real PC with
a real keyboard and mouse, though you can edit on a tablet if you like.

After logging in, there are four main editing areas:
* You can add times. The time must be HH:MM.
* You can add extra text for any day of the week (such as karate class on Friday)
* You can add special days (like a birthday)
* You can set your hometown


some arch notes
- currently, checking times for all tasks every second. This is a bit of overwork.
	Alternative is to set exactly the right timers for each task. But then there are
	race condititions when editing the tasks and deleting timers, etc.
	Also, unless you'd create 120 timers (one for each second) of the progress
	bars during a task countdown, you'd still need to check each second
	to make the progress bars work.
	(Unless there's a nice way to make the progress bars auto-animate).