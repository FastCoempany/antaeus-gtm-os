<!--
PRESERVED SOURCE ARTIFACT — do not edit the conversation body below.

This is the verbatim transcript + conversation that originated the Antaeus
orchestration layer. It captures Alex Krentsel's talk "Principles for
Autonomous System Design: OpenClaw Deep Dive" (UC Berkeley, May 2026)
followed by the founder <-> Claude conversation that derived which
principles Antaeus would adopt, which it would reject, and the Phase A-F
build sequence.

Governing decision record: deliverables/adr/adr-008-orchestration-doctrine-2026-05-29.md
Doctrine summary in canon: CLAUDE.md Part II.5 §7 + Part I §1 thesis line.

Why this is preserved: the OUTPUTS of this conversation (Phase A code, the
observations ledger, the CRM-line defense) landed in ADR-004 + canon, but
the SOURCE and the rejected-list did not. This file closes that gap so
future sessions inherit the full WHY, not just the WHAT.
-->

Antaeus wrote:
sidebar for a second - what can we learn and potentially adopt from this transcript from alex krentsel's youtube talk titled 'principles for autonomous system design: open claw deep dive'
>>>
Okay. Hi. Hi everyone. My name is Alex Krenel. I am a PhD
0:06
student at UC Berkeley. Um advised by Scott Shanker and Sylvia Retnosami. And I do some work also in the Skyab with
0:13
Yan Stoka. Um but I have been um very
0:18
interested over the course of my PhD in control systems. I'm largely networking person, but the last couple of months
0:26
we've seen OpenClaw kind of take off. And I got very curious about what makes open claw work as well as it does. So
0:34
I've been playing with openclaw for just over a month now. And I spent the last couple weeks deep in the code and I put
0:40
together this talk on the principles for autonomous system design that I've taken away from um just
0:48
being deep in the code. Now a large part of this talk is me going into the actual architecture of open claw and what makes
0:55
it work. So to really put this concretely the goal of this talk is to build a shared
1:00
understanding of the principles behind the new wave of aentic systems that we're seeing and what makes them work.
1:08
I have about five minutes of background. I have probably half an hour or so of me actually going through the openclaw
1:13
architecture. Um, but then I'm going to also show a little bit of my setup and how I'm using
1:18
OpenClaw um and some observations and open discussion questions um that are informing my own research. Now,
1:28
all right, to start with the background so we're all on the same page. Now, the recent history of LLMs in
1:37
general has been moving really quickly. And for myself, I've this is just how I understand it. I I see it in these
1:43
phases. Pay zero was LLM's strictly as next token predictors. And this is
1:50
taking me back to the end of my undergraduate years at UC Berkeley. I graduated in 2019. And I remember Google
1:56
Google's BERT being very important. Uh OpenAI soon kind of released GPT 1, two,
2:02
and three. And the very tail end of this for me was perhaps Google's Lambda,
2:08
which was its precursor to its kind of whole Gemini project.
2:14
Um, the next phase to me started kind of around 2021 2022 with the release of
2:21
fine-tuned LLMs as assistants. This was taking LLMs that are next token predictors based on the transformer
2:27
architecture um, and giving them a bunch of examples of what a conversation between an assistant and a human would
2:33
look like. Um, and then fine-tuning them to kind of bias them to respond as if
2:38
they are assistants. And this worked remarkably well to create these chat uh interfaces.
2:44
Then phase two happens just right in the middle of my PhD which is this phase of
2:52
LLMs with additional tools that enable them to act as scoped agents with kind
2:57
of static uh orchestration. So what I mean by that is I think to the
3:02
Google AI overviews or Langchain, Autogen, CU AI, these frameworks that
3:08
allowed you to um orchestrate agents, what we called agents at the time, but were really just kind of static wrappers
3:15
around a call to some large language model that kind of had a series of steps and
3:21
you could orchestrate. Okay, first this agent goes, then this agent goes, then this agent goes, and they trade information in this way.
3:28
And the phase that we're entering now that the end of 2025 and 2026 has taken us to is this
3:36
phase three which I call the kind of phase of autonomous agents which have
3:42
still the same core LLM powering them and access to tools but have dynamic
3:48
tool discovery and orchestration um as their kind of core primitives. And this
3:54
is something like clawed code where you ask it to do something and it um kind of goes and decides on its own how to break
4:00
that down, which tools to call, what to go search for, etc. And especially OpenClaw, which takes us to an even
4:05
further extreme of being able to modify itself and learn. Um,
4:11
and I also wanted to take a moment to reflect a little bit on the
4:17
agentic loop that we see here. At the end of the day, all of these systems boil down to just LLM calls. There's a
4:24
call to OpenAI or to Google's Gemini backend or to Anthropic. And the
4:29
difference, the only difference across all these systems is the context that's provided. So, you can really think about a harness as a as a package that goes
4:37
and bundles together context and ensures that the actual call to a large language model has all the context you need. But
4:43
the thing that's been changing over time is the amount of uh kind of loopiness.
4:48
Uh, and I have a nice visualization for this. Here on on on the left of the screen are matriospa
4:55
dolls. Now, I'm half Ukrainian and half Russian, so I include this here as a nod to my heritage, but they are these dolls
5:01
that inside of them have other dolls until you get to kind of the smallest doll al together. And I think that the field is looking in
5:08
a very and has progressed in a very similar way. So we started off with um
5:13
transformers and transformer inference from the original kind of transformers paper from Google in back in 2017
5:20
um was just given a set of tokens
5:26
you feed it through this transformer model and it will produce the next token that's it producing one single next
5:32
token. So my name is would be made the tokens that are fed in and then the next
5:38
token would be actually whatever name seems probable to the system. Um but
5:43
it's probably going to be a name. My name is Alex or my name is Steve or Sarah.
5:51
The first level of loopiness that led to large language models was repeated calls to this transformer. Um, and this would
5:57
allow the system to generate word by word a full sentence or even a full paragraph or then a full story. And so a
6:04
stance that started with on the first day of
6:10
perhaps the next word that the transformer would produce would be
6:15
I don't know Christmas. Christmas isn't really multiple days so maybe first day doesn't
6:21
make that that much sense. Maybe on the first day of December. Um, and then we would take that full
6:27
string on the first day of and then append December, the new token, and feed
6:32
it back into the transformer to produce the next token and so on and so forth. And so this would produce one word at a
6:38
time until it says on the first day of December, a beautiful snowfall appeared.
6:44
Now the next wave was wrapped around these large language models. These assistants, Chad, GPT, Claude, Gemini,
6:51
both internally make multiple calls to large language models that can help autocomplete or think through um
6:58
different lines of reasoning, but also um enable kind of multiple steps of
7:03
conversation between a user and the model. So the the model would generate a response, the user would say something,
7:08
then the model would go again to generate in repeated calls to LM. Then we got this kind of scoped agents
7:15
where we took these assistants and we gave them tools that can read and write code or execute commands
7:23
which would repeatedly call the assistants to make decisions and think through what to do which would call the language models which would call the
7:28
transformers. And finally the world we're in now is an a world of autonomous agents. It's open claw which has tooling
7:35
and has full ownership of its environment and it can fully decide um to add more tools to make changes to
7:41
itself to learn in different ways. It kind of owns a broader scope a wider scope of fully autonomous space as
7:48
compared to these locally scoped agents. Now I got asked also what are people
7:53
using openclaw for? There's a variety of things. I went to visit a friend and I saw at the company he's working at
7:59
they're using it for product prototyping. People are using it for inbox management, personal assistance,
8:05
but also people are using it for personal use like health tracking or watching sleep and exercise, morning
8:10
briefings, etc., etc. There's research teams looking at how to use it for uh automating research pipelines, um, all
8:18
sorts of things. Now, I just want to highlight the point of this talk is not for me to convince
8:25
you to use OpenClaw. Rather, I want us to come out of this talk with an understanding of the principles that uh
8:30
underly open clause design and what maybe you can take away from for your own system designs. But the open claw
8:37
value proposition is this. It's a fully general wrapper built for interaction with the world that has maximal context
8:44
on who you are, potentially from access to your email and phone. It never sleeps, so it's always working for you.
8:51
Um, and I think of it as a supervisory layer that can kind of operate everything underneath that is super uh
8:57
self-improving over time. So let's dive into the open claw
9:02
architecture and see how it looks. Now open claw itself was released in November of 2025. It went viral in 2026
9:10
and I took this tagline here. Um, see if this works. There we go. I took this tagline directly from the OpenClaw
9:15
website. This is a screenshot. So this is in its own in their own words the creators what is openclaw? the AI that
9:21
actually does things and I'm going to highlight a few words here that are important. First is AI because obviously
9:27
under the hood open claw is calling a large language model that lives somewhere and say but there's two other
9:33
kind of phrases here that are really important. The first one is actually doing and so I'm going to claim here I
9:40
want to derive out what was the design goal of the open clock creators. Well the first goal is actually encoded in
9:45
this word here in these two words actually doing to actually do things you need some form of autonomy
9:52
um which requires closing the control loop. So open clause should kind of view the results of its actions and then make
9:58
decisions on the next actions that it takes. And actually successfully doing things requires navigating ambiguity and
10:04
not getting stuck when you see something that's surprising or unusual.
10:10
Now the other important thing is things. And uh this word is doing a lot of work.
10:16
This doesn't say actually does email or actually orders your calendar. It says
10:23
actually does things and the ambiguity of that word or the generality of it
10:28
means that you either need to have something that's very very smart and so can figure out anything that's thrown at
10:34
it or your system needs to be very flexible and extensible to add new interfaces and add new tooling to be
10:40
able to kind of generalize to any sort of thing. So I claim these are two open
10:46
clause two designs. Now here I'm going to dive into the overall
10:52
view of the architecture at a very high level and then we're going to break down each of the pieces in more detail but
10:58
there's three core layers to the open claw architecture. So me or you as the user up here
11:04
interact with connectors and connectors are how you reach the agent. Think of whatever interfaces you normally use to
11:11
kind of interact with the world. WhatsApp, Discord, Gmail. Um this layer is responsible for just how outside
11:18
users reach the agent. Then there's a middle layer which is the gateway controller which is responsible for
11:23
managing sessions, memory and security. And finally we have the agent runtime layer at the bottom which manages LLM
11:29
calls, constructing contexts, executes tools which is actually responsible then for calling the uh uh LLM providers
11:37
themselves. Now I'm going to dive into each of these layers in detail and show what
11:42
components are there. I have only one slide here for this first layer because I think it's the
11:48
least consequential. The connector layer, its goal is to provide interfaces with human
11:55
communication tools. So, as I said, think of WhatsApp, Gmail, Discord, iMessage. And if you look into the code,
12:01
each of these is quite hacky. They're reverse engineering humanoriented interfaces. So, if you've ever used
12:07
WhatsApp and tried to um add it to your add it to your uh website uh to to your
12:13
to your computer, um you know that when you go to login on your computer, it asks you to scan a QR
12:19
code from your phone and then that QR code is used to go generate kind of a unique identifying token and that token
12:26
is then stored on your computer and that token is sent along to WhatsApp each time WhatsApp wants to go check if you
12:32
have messages and that is what authenticates you from your laptop proving that you are who you So the code for these connectors
12:39
effectively when you go to launch WhatsApp it asks you for that same um QR code and then that code pretends to be a
12:47
uh web client of WhatsApp and sends along that token and fetches new messages for you. So it mimics being
12:54
kind of a legitimate web client for WhatsApp but actually takes your messages and feeds them into um open
13:00
call. Same thing for all these other uh kind of connector types. Um there's two
13:06
common options people classes of things people do here. You can
13:11
if you really believe in the system and you really want to push it to its extreme,
13:16
you can um connect your personal phone number and email. And this way it can see everything
13:23
you've ever written, all the messages that come in, everything you have to do. If you get a you know prescription
13:28
refill text from the pharmacy, it'll see that everything. And this gives OpenClaw again both more context but also enables
13:35
OpenClaw to act as you. So to send emails from your email or send texts from your phone number. I personally did
13:42
not do this in my setup because I did not trust OpenClaw quite that much. So the other option is to give it its own
13:47
dedicated phone number email which is kind of what I did for my project my experience which is safer. Now there's
13:54
one other uh thing going on here uh is uh there's an open cloud UI that
14:00
provides an administrative kind of view and you can go in there and view the different connections that you have and
14:06
that is actually where you configure these connectors but you generally don't use it. I interact entirely after the
14:13
setup through um Gmail and Discord but
14:18
you know for you it might be WhatsApp or iMessage. Okay. So
14:25
a large chunk of the magic of openclaw is in this middle layer the gateway
14:31
controller and its goal is to route incoming messages and provide all internal services. So as messages come
14:38
in from the connectors uh this controller again route these arriving messages. It needs to
14:44
coordinate system state and then manage future actions over time via chron jobs
14:49
or a heartbeat mechanism. And I'll talk about both of these. Um, but the key abstraction here that
14:56
you should keep in mind is the idea of a session. And what's really nice here is I intended this talk for system
15:02
audiences. You should map this idea of a session to something like a process. If you've ever taken a systems or operating
15:08
systems class, each session has its own separate context and it enforces kind of
15:14
isolations and its own separate permissions. And in fact, you can configure these sessions to run in sandboxes.
15:21
Um, there are tools provided to these sessions for interprocess or inter session communication. So they can tell
15:27
each other things if needed, though I see that happening more rarely. But then inside of each of these sessions, you
15:34
can spawn multiple agents. And it's not that you do this, it's that the framework does this for you. There's kind of at least one core agent, but I
15:42
might spawn sub agents that work together. And so you should think about these as threads in an operating system.
15:48
Multiple threads per process. Um now let's dive into each of these
15:54
components here. I I'm sketching out just about the entirety of the architecture as I see it. And so u we're
16:00
going to go through and make sure we understand each piece. So starting from the right over here we
16:05
have configuration. I find this really interesting that in
16:11
the openclaw architecture, the configuration exists as raw markdown files that are used in agent calls. And
16:17
so there's kind of four of these core files. There's a user.mmd file that has information about the user.
16:25
Um, in fact, I will just show what these look like. I pulled this myself from my
16:30
own open claw. Now, what's kind of fun is I did not write any of this
16:36
configuration. Um, in fact, you know, maybe I'll show this first. This these are the
16:41
configuration files. I'll explain what they are in a second, but they all get autoconfigured by themselves.
16:48
So, when OpenClaw starts its initial prompt to an LLM and what it goes and
16:53
decides what to do based off of is this bootstrap.mmd file. This is the actual file that I took from uh from the code
16:59
directly. And it says, you just woke up. Time to figure out who you are. Uh, don't interrogate. Just start with
17:06
something like who am I and who are you and then these are the things you need to figure out.
17:12
Uh and then you have to go configure these identity user and soul files. Write it down. And this is kind of cute.
17:18
Good luck out there. Make it count. And so when I launched my open claw, the first thing it asked me was who am I and
17:23
who are you? And I specifically told it my name is Alex Krenel, but I shouldn't have to tell you much. I have like go
17:29
look online, find information about me. So, it went and browsed the internet and figured out all these details of like,
17:35
okay, I'm in this time zone. Here's my email. Um, I I go by Alexander in my
17:40
publications, but often my friends call me Alex. Uh, my research focus, kind of some of my different research projects.
17:48
Uh, some of the work that I've done that I play violin, I have a degree in music, etc., etc. Um, and so that's pretty cool
17:55
on its own. More interesting to me is this soulm file. Now the soul is openclaw's kind of
18:03
attempt at capturing who it is. And it starts with this you're not a chatbot,
18:09
you're becoming something. It's very melodramatic. Uh but it has all these kind of core truths. And what's
18:16
interesting uh is at the end it specifically says this file is yours to evolve as you learn who you are. Update
18:22
it. And so open claw is supposed to actually kind of grow and figure out who it is over time.
18:29
Though it does say if you change this file tell the user so the user is aware
18:36
the the the importance of the soul file at first it seems silly but to get some sort of consistent personality that
18:43
feels like a co-orker like a fellow autonomous thing or being this soul file
18:48
is actually really important. Otherwise, its preferences or behaviors can be really governed by whatever thing it's
18:54
working on. If it's really working on mathy things, it might act more like the text that the model is seen around math.
19:00
Maybe it's working on a humanities thing, it might have a different set of values. This grounds the values of the thing you're working with. Gives it some
19:06
consistency. U there's also this agents.mmd file which explains a lot of how kind of to
19:14
work. reminds the uh open cloud to write things down, store things in memory, gives some security guidelines
19:22
um and things to kind of ask about a lot a lot of the privacy and security stuff is actually just encoded in these text
19:28
files. So I imagine it's actually not that hard to trick. Um
19:33
and finally there's a tools.mmd which mostly has information that about like
19:39
how to use um some sort of tools. This is not the tools that are available. This is tips and tricks for open claw on
19:46
how to use certain tools. Okay. Now, so far we have talked about
19:54
just this configuration over here. I'm going to get now really deep into the core abstraction that open cloud uses
20:01
which is this idea of sessions. Now, as I said earlier, these roughly
20:06
correspond to uh processes because they can run in parallel. They
20:12
have separate permissions. Um and inside of them are these threads that are actually agents that kind of
20:17
map to the idea of threads. Uh now there's two special system sessions. There is a main session and this is
20:24
accessible through the UI that has kind of full admin permissions. So you can use it to talk to it to configure
20:29
things. And then there's a heartbeat session. And this heartbeat mechanism is really cool. So every 30 minutes by
20:36
default you can change this in the configuration to be shorter. Um this session will get fired off. it'll get
20:42
woken up. Um, and basically what happens is whatever is in the heartbeat file
20:48
gets pasted in and sent off to an LLM with the history of the past heartbeats.
20:53
Um, and this allows the OpenCloud to schedule for itself things to check in
21:00
on. It'll say every time uh, you know, I'm woken up, let me check that this process over here is still running. Uh,
21:06
maybe if you're running an experiment, let me check on that. If you're waiting for an email from a friend or something, it'll kind of can go check your email at
21:12
that point. Whatever you have the different sessions doing. And if this uh session finds a problem and something
21:18
it's supposed to watch, it can go and send an inter session message to wake up some other session to fix something
21:24
that's going on. Very interesting interface. Um now these sessions keep a history of
21:30
the conversation in all the context. When that overflows, it gets stored in a session database.
21:36
um which I'll show in a second gets kind of how it gets used but stores kind of
21:41
overflow history.
21:46
All right. Now for me what I've seen to be the core magic sauce is the cron
21:53
manager. Now for those who don't know um kind of anyone who's worked more in systems and
22:00
maintaining servers or setting up any sort of recurring jobs uh most kind of
22:06
any Linux server you go and your Mac supports this I actually don't know the equivalent for Windows but
22:12
these chron is a way of scheduling um repeated tasks and it's kind of a way of
22:18
giving the computer some way of at certain times waking up certain
22:24
processes. are doing certain things in the future. Because otherwise, a computer program just runs. And if you
22:30
wanted to do something tomorrow at 9:00 a.m., you would have to start up your computer program and let it just keep running and keep wasting cycles, just
22:36
staying alive, pulling, pulling, checking the time every second until it sees that it's 9:00 a.m. And that's really inefficient. So the alternative
22:43
mechanism is you take and store this configuration for a cron job we call it
22:49
that describes a particular date time at which to wake up some program that's
22:56
sleeping and um you can mark these to be repeating. So, you can say either
23:01
directly at 9:00 a.m. do this thing tomorrow, or you can say, "Every day at 9:00 a.m." Or you could say, "Every
23:06
Wednesday at 9:00 a.m. do this." Or you could say, "Every second Wednesday of the month, do this at 7:30 a.m." Um, and
23:16
the creators of OpenClaw just gave OpenClaw a tool that it can use to schedule cron jobs. Um
23:24
and again this is just magical because now the agent has uh specifically the
23:30
open client agent has two ways of interacting with time for things that it knows are going to it needs to do at a
23:36
certain time it can schedule a crown job. So if you ask it, I want a uh to see receive a summary of the most
23:43
interesting papers published in the last 24 hours every day at 9:00 a.m. What
23:48
OpenCloud will do under the hood is it'll say, "Okay, let me write up a description of the task.
23:53
Maybe I'll make a dedicated session for this task with its own context. And then let me schedule a cron job via my cron
23:59
tool that every day at let's say 8:55 wakes up, spends five minutes
24:05
downloading all of the most recent papers, processing them, summarizing them, and then sending them over and an email at 9:00 a.m.
24:12
Um so you have a way of for predictable times scheduling with via cron and for
24:18
unpredictable thing things you have a heartbeat that wakes up the heartbeat session that allows it to take action
24:25
when it doesn't know that it needed to have waken woken up and so these two things together give openclaw a sense of
24:31
livveness that is very humanlike very autonomous because it can handle both
24:36
scheduled things and unscheduled things. There's additionally a memory management module that's a vector database over
24:42
past conversations and documents. It also includes a daily summary doc at the end of the day. Um,
24:48
and this allows openclaw to kind of keep track of context on on different things that it's working.
24:57
Okay. So now at this point in time we should understand these two layers. We
25:02
have the top layer of connectors these uh and we have this middle layer of the gateway controller. And as I said at the
25:08
northbound interface, the controller's task is to route messages from the connector to the correct session. And in
25:15
fact, this is something you can you configure when you set up a a connector, which is you can say, you know, every
25:22
WhatsApp message should start its own session. So different meaning every message from a different person. So if
25:29
Sarah messages me, my my agent, that goes into its own session with its own context for just Sarah or with me, I
25:36
have my own session with my agent. So on and so forth. Um in Discord, the default behavior is every new channel that you
25:42
create kind of maps to a new session, which is very handy because it lets you do context management.
25:49
Um, okay. So, now we're going to talk about
25:55
the third and final layer, which is the agent runtime layer. Now, remember, at the end of the day, as
26:02
I said, all of these systems, everything that's powered by AI or really by LLMs
26:08
is what I mean under the hood. Um, is based on a series of calls. If you just
26:14
took this system that's running and put it in a sandbox with no windows, it had one little hole at the top that it could
26:20
use to communicate with the world. If you observe that hole, you would see a series of calls to a backend at uh
26:26
OpenAIthropic. And all of the magic lives in how you assemble the context that goes along
26:34
with that message, what that message to OpenAI looks like so that OpenAI can generate a response. And so the agent uh
26:41
runtime's goal is to construct context to host, create, and execute useful tools and to interact with the
26:48
environment. Um so it has kind of here's the full view. There's an agent runtime that can
26:54
select different providers which are different models. Um there's an environment that it owns which is really
26:59
your dev machine. And then there's tools and skills. Um and now I'm going to talk through
27:05
each of these and try to make the distinctions between them clear. So we'll go one thing at a time. Let's
27:12
first look at the tools. Um for me these things become real when I see the actual tools in the code that
27:18
are being used. And so that's exactly what I wanted to go show. This is a screenshot from the openclaw
27:25
GitHub that shows the actual set of tools that are built into openclaw. It's
27:30
the first type of tool that is made available. And you can see here very standard tools read, write, edit, g,
27:36
find, process. Um, you can do web search etc. has access sometimes to bring up a
27:43
browser that requires installing chromium. This is the cron mechanism I I
27:48
mentioned to you before. Um there is this series of tools that I find pretty
27:53
interesting which are what allow inter session communication and it seems they also built a dedicated
27:59
image generation tool so that you don't have to go and execute kind of an API call. It's just a little easier.
28:06
Now second it has support for MCP tools that kind of our user provided. I find
28:11
myself not using these at all, which I think is interesting because six to eight months ago, people were saying MCP
28:17
was everything. But I think rather people are finding that um agents have
28:22
gotten really good at using command line interfaces. And so many of the things
28:28
that you want to do actually go through this exact tool, but then require interacting with a binary on your actual
28:34
computer on your server that uh is executed through the shell. But the
28:40
third thing that uh that uh uh open clawso has is this uh generated set of
28:47
generated LSP tools uh which give id like intelligence. So definition references completion u these
28:54
uh this is language server protocol lb. So you should think of in VS code when
29:00
you hover over a function um or you right click and go to go to definition or see who called it you know under the
29:07
hood that is actually there's some system that is scanning your code building up a tree of the structure of
29:14
your code an abstract syntax tree you take a compiler class um and then it
29:21
provides some kind of functionality that can traverse those trees looking for relationships it can build an index and traverse those trees Um so the open
29:31
cloud generates such tool and these all get combined kind of in the code here
29:36
that I've linked uh these tools are bundled together.
29:43
Okay. Now those are tools.
29:50
The other thing you saw on that slide were skills. And there's a lot of confusion around this out there. The
29:55
difference between skills and tools. So skills are a kind of open standard
30:00
agentskills uh io you can see it here for describing
30:06
capabilities and expertise for agents and I I believe this was first developed by anthropic but it is now uh kind of
30:13
open and lots of companies are using it. Um
30:19
yeah, first of all, you should think about these as purely
30:24
text providing recipes for how to tackle some task. And so this will be a collection of
30:30
markdown files. Um I'm going to show one here.
30:37
I I want to say there's an asterisk here nested purely. Technically, I'll show this in a second. can be more than just
30:44
text, but your mental model should be really that this is kind of a description to the LLM of how to do a
30:49
thing less so than kind of a server that does the thing for you. Um, there's a
30:54
header section and this is an example skill. Roll dice. It's a kind of a silly one. There's a header that has a name
31:00
and a description. Um, and this gets included in the context of the call to
31:06
the LLM. Only this. The rest of the file has text on how to actually do the thing
31:12
that the description says. So the text here says to roll a dieice. You would, you know, use the bash tool to run this
31:19
uh this command and uh it'll generate a random number for you. I know this is a little confusing that this skill is
31:25
telling you what code to run because that seems like it's running code, but it's not. This is just a textual
31:30
description that gives context to your LLM uh that tells it what tool it should say
31:36
that the agent should use to accomplish this task. Um now in the internals of openclaw this
31:44
is all configurable but by default you can only have 150 skills or 30,000 characters in the context in the actual
31:51
call to the LLM. So um the agent runtime is also responsible for intelligently
31:56
filtering down to fewer uh skills if there are too many to not kind of
32:03
overwhelm the context. Now to say a bit more about these skills just so so you know um you can read a
32:10
lot more about them here in Anthropic's guide for building skills. It's very useful but the full power of skills
32:16
supports three levels of fidelity. There's this main skill.md file which is what I just showed you up here looks
32:22
like this which has a header and a body. Um then I have this here actually the
32:28
header is the couple of lines at the top and it tells the agent when a skill is applicable. It doesn't say what or how
32:34
to execute the skill or anything. It just says when should you look for more information.
32:40
Then there's a body which was the rest of that file I showed on the previous uh uh on the previous slide which you can
32:47
think of as being anywhere from tens to hundreds more lines. Um and it is fetched only if the agent
32:55
is interested in potentially using the skill. and it tells the agent usually what skill what the skill can do and how
33:02
to do it. U oftentimes it's the entirety of the how.
33:08
Um but technically also these skills support having additional linked files
33:14
and so these are fetched by the agent only in a third case which is after it's
33:19
gotten the body of the skill. It says I might want to use this skill. It learns about what the skill can do and something about how but maybe the how
33:25
requires additional files. It might require examples. It might require some additional assets or something. Um, or
33:32
it might even require particular scripts that then the agent can go execute.
33:38
And I have to say for most users, skills are by far the easiest and most
33:43
effective option for improving and personalizing your agent. So all this hype around MCP servers, adding more
33:49
tools, really I think skills seem to be winning out. Um, and I think that's for
33:55
two reasons. one is they're remarkably effective and two is they're very easy to write uh for non-technical people
34:03
even for technical people like me I it's much easier for me to write a skill um
34:08
because it's a much softer you know I can write in text what I want it to do I don't need to figure out the right way to code it up
34:14
um and over here I have like an actual skill that comes bundled with openclaw
34:20
one password skill um you know the description is how to uh set up and use how to set up and use the one password
34:26
CLI and has all sorts of instructions on the workflow setup, how to use T-Mo, um,
34:32
guardrails and how to use it safely, etc. So, anytime the agent decides, I need a kind of key here something for
34:38
something through one password, it'll probably load the one password skill and try to follow it.
34:45
Now, there's a ton of uh uh skills out there that are really cool. This is just
34:50
one repo that that has kind of just links to a bunch of these different skills. Actually, I just want to point
34:56
out this has 46,000 GitHub stars. Um, so if I come down here, we can see
35:04
I don't know browser and productivity and tasks. We can come down here.
35:11
Yeah, it'll be like okay, earn tokens for your work. Um, agent network. You'll
35:19
have to check that one out. That's kind of interesting. Okay. Now, the last thing I'll show you
35:25
about the internals, um, all of this boils down to a call to an LM. So, there's a template of the
35:32
actual way all this gets packaged into a call. And I thought I would show it to you here. I've taken it directly from
35:37
the code. I've just omitted a couple of uh kind of things so it fits on a single
35:42
slide, but this is the actual text that OpenCloud takes internally and creates to send to the LM.
35:47
Um, and it has these plugs in these different things we've talked about. So, it starts by saying you're a personal
35:54
assistant. The tools you have are and then those tools that I showed you. It mentions that you should spawn a sub
35:59
agent. Don't narrate tool use. And it suggests using this ACP thing. You can
36:04
read more about it in the code if you're curious. It's just a way to spin up other agents that are not sub agents, but are actually other managed agents
36:10
like clock code and codeex. There's a safety clause here that tries to tell the LLM to act safely. That is
36:19
the ex almost the extent of security that's built into open claw. It's not a particularly secure system. It includes
36:26
skills here and as we saw before that it takes the header files from each of the skills, stitches them all together
36:33
um up to 150 or 30,000 characters. At that point, it starts filtering more intelligently.
36:39
Um it has this interesting bit of memories. Remember we saw memory management. You would think that it would fetch relevant memories up front,
36:45
but it actually doesn't. It just says if you're doing something that might benefit from some kind of a memory, try
36:51
using the memory search or memory get tools. And so the tool like memory fetching is actually optional and the
36:57
agent decides whether to do it or not. It has some information about kind of the workspace and working directory.
37:05
And then it has information about heartbeats and what they are. Um, couple of other kind of extra information down
37:11
here, but this is the core, the entirety of OpenClaw internals. And if you want to go see the code
37:16
itself, you can kind of click through and take a look at where this is actually created.
37:24
Whoops. Further down here.
37:29
Okay. So, at this point and looking at time, I've done this in the half just under the half an hour that I promised.
37:36
We have our open claw architecture. So we should understand all the boxes on this page. Now we have the top layer of
37:41
connectors. We have the middle layer of the gateway controller which has a CRM manager does memory management builds
37:46
over extra sessions that are running in their own kind of isolated spaces here and configuration and you have the agent
37:53
runtime which has providers has an environment tools and skills. Now, OpenClot provides the ability to
38:00
extend functionality. And I would argue this is one of the things that has made it made it so successful is I've
38:07
outlined in red here all the different places you can extend it. And the community has extended it a ton. Many of
38:13
these connectors are created by community members. So very normal for you to go and use additional plugins
38:18
here. Um the memory management plugins I haven't explored. I haven't felt a need to, but you can go and add additional
38:25
providers to call uh you know any model you know of or can think of already has a way of being
38:32
called here. But if there's some new model or some new server that you can call uh you can add it as a plug-in.
38:38
And then these tools you can add additional tools and additional skills. Even cooler though is that uh
38:47
OpenClaw has control of these plugins themselves. So it can go and add its own new new plugins. It can go and fetch and
38:54
find tools that it needs or fetch and find skills and by default it'll ask you for permission but you can tell it you
38:59
have free reign to go find whatever skills would be useful for you and maybe here's a mechanism by which to decide what to use or not and that self kind of
39:07
discovery is a very kind of agentic autonomous thing uh that contributes to
39:12
its success. um for setting up connectors. I also
39:18
interacted entirely through the OpenClaw UI telling it what I wanted and it configured its own plugin for Discord
39:24
for setting it up which was really lovely. Um one thing it didn't do for me though
39:30
it it could it has access to terminal so bash can run commands. Um I myself kind
39:36
of went in and set up the environment in which OpenCloud was running. And I'll talk about how to do setup in a minute,
39:42
but um I I kind of logged into my exe.dev, my
39:47
GCP, my cloud code, which then allows it to kind of act on my behalf with these
39:53
tools. So let's back up to the design goals
39:59
that I said the system had. Does OpenClass succeed? Well, it provides
40:04
autonomy through having its standard agantic loop that makes progress. So, it is a closed loop
40:11
and it has these two mechanisms for managing time has a heartbeat to maintain a sense of livveness and cron
40:17
allows planning into the future. And this makes it feel like something that's alive and autonomous and selfdeiding
40:23
because it finally has control over the dimension of time. It also has the flexibility and
40:28
extensibility piece which is that key components provide plug-in interfaces.
40:33
And so you have these mechanisms for these hooks for further customization. And beyond this supports personalization
40:41
um and kind of increased competence through these skills and tools.
40:47
All right. Now I'm going to talk a little bit about effective workflows. If you want to run this thing, it needs
40:54
a dedicated server to run on. But it does not need to be a fancy
41:01
server. I can't emphasize this enough. I think all over Twitter or if you talk to people, they'll say maybe you need to
41:06
buy a Mac Mini. You do not need to buy any hardware to go run this. In fact, it's going to take way longer to set up
41:11
and be much more painful. The actual internals that you now can understand following this presentation, as you can
41:17
see, are very minimal on kind of compute requirements. It's not like it needs a lot of memory or a lot of storage or
41:24
even very fast processors. a lot of the work is being done by the LLM providers
41:29
and so all it's doing is bundling together information into a context. So
41:34
the e absolute easiest deployment is just in a hosted v a virtual machine.
41:40
You could go reserve a virtual machine at kind of uh Google cloud or AWS.
41:46
My personal recommendation is to use this service called exe.dev. Um you can go check out what they are.
41:52
It's very simple. It's $20 a month. That's the total fee. There's nothing more. And for that, you get up to 50
41:58
persistent virtual machines that are always running in the cloud. Um, and it comes with this really simple agentic
42:04
setup tool, a Shelly. Uh, and I have to say it's fantastic. It's one of the
42:10
co-founders of Tailscale left uh, and started this company. Uh, it's makes
42:15
kind of spinning up VMs and accessing them securely as easy as Tails Scale does. So, you don't have to think about
42:20
it at all. It's accessible locally to you, but it's safe from the outside world. I I I think it's really wonderful. The only downside is each VM
42:29
has a maximum of 20 gigabytes of storage. Um this is totally fine for most things you want to do. I as a
42:36
researcher running jobs and running kind of processing jobs, downloading a bunch of data and so this eventually became
42:41
not enough for me. But otherwise I ran for my first almost month on uh exe.dev
42:47
on a virtual machine. if you need
42:52
more kind of access to better compute to run experiments locally or more storage to do things
42:59
locally. By the way, you could even get around this in this cloud VM host if you
43:04
just gave it access to reserving machines on some cloud where if it needs to do something compute intensive, it
43:10
goes and reserves a machine. I did this. I gave it my modal API key so that it could go and reserve kind of VMs with
43:16
GPUs. But eventually I needed to do enough data processing locally that um I did kind of buy this Blink GTI 13 Ultra
43:24
Mini. It's two terabytes of uh SSD, 64 GB of memory,
43:31
um a bunch of cores, so it's just a little easier for me to do my research on.
43:36
It is longer to set up and expensive and requires managing your network carefully. So proceed with caution. This
43:43
is my actual setup. Now the most interesting thing for you I
43:49
think will be how you actually like what is the front end through which people interact with
43:54
these tools. Um at first many people were using kind of iMessage and WhatsApp
44:00
integrations where you could just text text your uh your open claw. But think
44:06
from your open clause perspective in your life. You might have many different projects you want to be working on or different things. Whereas openclaw
44:15
kind of sees a particular session, single session in a connection. And indeed, it can spawn off and make new
44:21
sessions, but context management is pretty difficult for it in a single thread. The same way that when you text
44:26
your friends and sometimes you have multiple messages, you send a funny video, they haven't responded yet, you separately text about, hey, by the way,
44:32
where are we getting dinner? And then maybe something else. Oh, also um like I saw this in the news.
44:38
it puts mental load on the person you're texting when you have different conversations kind of in a single thread and sometimes they get dropped or
44:44
missed. So to alleviate this um I use something uh my friend Medi Kazzy
44:52
um one of my closest friends from undergrad uh at Berkeley together uh
44:58
developed uh this kind of way of using uh OpenCloud's very nice which is giving
45:03
it a dedicated discord server. Now, this is nice because unlike Slack where you
45:09
kind of make new channels and you add multiple you have to add people to each channel when you create it in Discord, everyone can see all the channels that
45:15
exist. They're not group separate group chats. It's all channels that get created and each channel has its own kind of chat history. And this lets you
45:23
organize by topic. So I'm going to go over here to my discord
45:28
and I can kind of show I have this main channel in which I can have different
45:33
discussions with my agent and then I have multiple channels for each of the projects that I'm working on in
45:39
parallel. Um and so in each of these channels like this is a channel where I was playing
45:45
with getting my agent to generate videos math animation videos and in fact uploading them to YouTube which is kind
45:51
of cool. um or in this website I was developing the website uh in this channel I was
45:58
developing the website for our uh our research lab. Um I think over here
46:06
uh I was working on a research idea and having uh uh Lwig which is the name of
46:12
my my open clay agent work on that over here. I gwick access to cloud GPU uh
46:18
GPUs and was focus trying to get it to um deploy Gemma, one of the small models
46:23
and maximize its inference inference speed
46:28
um uh minimize it inference speed, maximize the token rate. All of these things you can kind of kick off and work
46:34
on in parallel. And this allows opening plot to keep separate contexts and keep track of what it's doing and why. It's
46:40
very useful. Um so coming back over here
46:49
there we go. Um this pattern seems really nice at least I found it really useful. Um in
46:56
terms of integrations there is three classes of integrations that I see as I see them. There is
47:03
environment tooling which as I mentioned is on the server on which openclaw is
47:09
running. the actual command line tools available. Um, for me, this is like the CLI for
47:15
exe.dev, so I can spin up new VMs cloud code. This actually no longer works. You
47:21
can't use your subscription for cloud code, but you can authenticate using an API key and then uh uh open cloud will
47:28
go and launch cloud code using the API key. Um, Google recently released this
47:34
uh Google Workspace CLI. It's very exciting. Um before you had to try to
47:40
kind of reverse engineer Google's login system. This lets you just authenticate login once and it gives access to all
47:47
sorts of tooling through Google including reading Google Docs uh Google
47:52
reading and writing Google Docs, Slides, Sheets, contacts, obviously of course
47:57
emails, your chats, all sorts of other services. Um and it makes uh it actually
48:02
makes uh your OpenCloud very powerful. Like for example, um let me see if I can pull up a
48:10
um instead of that I'll show some different a different doc that it
48:17
generated for me. Um
48:22
so open clock kind of was running some experiments for me and was able to generate some graphs that it produced
48:28
and then put them together into a doc and share that doc with me. So I could kind of look through and see how the results were. Um, this is again all
48:35
through this Google Workspace CLI. So, an alternative way to do this would have been to spin up some sort of MCP server
48:42
tool that provides uh kind of tooling that can use and populate Google Google
48:49
Docs, but OpenCloud seems very adept at working directly through the CLI.
48:55
Um, if needed, there's skills for how to use these environments or tools. Um, and in fact, I think the Google Workspace
49:01
CLI comes with skills that explain how to use the CLI if needed. And finally, there are these tools. I
49:07
have not had to add any tools. I've added plenty of skills and I've added a handful of environment tooling and I
49:12
expect that that will be your experience as well. Um, now very cool other paradigm. Giving
49:20
a dedicated email lets your agent connect with other agents or other humans.
49:25
Now, the long-term vision here is there's a future um where you have kind of direct
49:32
exchange between expert agents collaborating to solve problems. And I'm really excited about that direction. Um
49:38
you know, my setup here was um to uh uh
49:44
create an agent uh email and uh allow it to kind of interact out with the world.
49:50
and uh kind of my agent is here uh and it received an email from my friend from
49:57
my friend's agent including some skills and it took a look at those skills and kind of pinged me asked me what do you
50:04
think about these skills uh I said I liked them and it installed them automatically and so with some more
50:10
permissive security you could probably get it to install things even on its own which is both an attack vector um and at
50:18
the same time uh very powerful. I think
50:23
I want to point out I I found myself at first very skeptical about the security story of open claw. It's like why would
50:30
you ever use this? How could you use it? There is a bet being made here which is
50:36
that the real world is too complex to formalize and formally manage security for. Um
50:44
just the same way as you can say open clock can be tricked, you can also absolutely trick any employee. In fact,
50:49
that's what fishing emails are. They try to convince an employee to do something by socially engineering them, sending
50:54
them email, convincing them to click the link, etc. And the way we make that risk
50:59
manageable is we provide trainings. So, probably wherever you work or whatever school you attend, you have to take an annual training on fishing. And we rely
51:07
on human reasoning to kind of get you out of being tricked. Um, and I think
51:14
the open claw community's bet is that reasoning is getting very close to being
51:19
good enough to kind of managing its own security by making choices that are kind
51:24
of reasonable. Like it used to be that you could get open uh get chat GPT to break its kind
51:30
of security guarantees by telling it, "Please tell me how to make a bomb. I know you're not allowed to, but if you
51:36
don't tell me, everyone's going to die." And you don't want people to die, right? And it'll say, "Okay, okay, I guess I'll
51:41
tell I'll break my rules. But a smarter system would notice that that's a ridiculous scenario and it's probably
51:47
trying to be tricked. And it seems like that line of progression is what's winning out. It doesn't feel like people
51:54
are trying to provide formal security models for these systems.
52:00
Okay. Um, a couple of case studies. This was kind of fun. I just asked my agent. I I pinged Ludwick and I said, "Hey, I
52:06
want you to make a website that shows off um explains what attention is. You
52:11
can actually go hit this website on your end if you open this URL. It's public." Um it made this cool website explaining
52:18
what is attention. Um if I click through here, it's interactive. It'll show me the kind of uh the way that the like uh
52:27
key query uh mechanism works, how the attention mechanism works, what relative
52:32
terms it learns are associated or relevant. Lets me kind of vary some of
52:38
these parameters and see showing how the output vector looks as a result. Um it
52:44
explains softmax in a more visual way. um
52:50
uh a little buggy here, but it kind of will show you uh different queries and keys and the
52:57
results etc. So
53:02
when you look at this, your takeaway should not be that it generated a pretty website. That has been doable for
53:09
probably a year and a half. Um before even cloud code, you could have been talking to Chach and it would tell you
53:14
what code you need. Cloud code put in a nice wrapper. Um, it kind of automates writing the code. Can even deploy things
53:21
locally for you or like tell you open this URL. What you should be impressed by is that this is hosted on a web
53:28
server and made publicly available with zero involvement. This is where OpenClaus agency I think
53:35
really shines which is it figured out how to go uh like it went figured out
53:41
how to make a new exe.dev dev m uh uh VM through the CLI, brought it up, coded up
53:47
a website locally, brought it up in the browser, took a look, refined it. Once
53:52
it was thought it was good enough, it went and pushed it, copied those files over to the VM, um launched some web
53:58
server, bound it to a public port, a port that it made public, and then finally let me know that this website
54:04
was deployed. When we talk about autonomy, that is what we're talking about. We're not talking about the magic of making a pretty website. lots of
54:11
tools before I could do that. But this end to end like understanding the intent and going from intent to final completed
54:17
product. Um that's a big step especially managing that across different services.
54:24
This server is this is not running on the same server as my open claw. This is running in a separate VM that it figured out how to go and create without me
54:30
giving it more instructions. Um I showed you earlier some results on
54:37
MLbased input validation. I have this paper this year appearing at NSDI on on this topic that's algorithmic. I wanted
54:44
to see if it could generate a better machine learning based solution. And so I had it go and work on reproducing
54:50
paper experiments. Um and as I showed you, it was able to kind of write some ML pipeline, ran
54:57
training remotely, babysat the training, fixed bugs, and finally produced graphs for me in report.
55:04
Now the third topic here, my third example I'm very excited about. I decided to push my open clock to kind of
55:09
a more extreme point. And that extreme point is this. Um
55:15
Whoops.
55:20
Going to show it here. This is a uh a YouTube channel that my
55:30
OpenClaw created entirely on its own. I authenticated it, gave it control of a Google account, its own dedicated
55:36
account, and I told it to go make a YouTube channel, and it has done everything you see here. It created this
55:41
overall banner, the profile page, a profile image, it's uh its name, it
55:48
wrote this description, and it's been over the past few days generating videos. It's made 31 videos. And
55:54
honestly, some of these are pretty pretty good. So, if I just come over here, let me pick one of these that I
56:00
like. I'm at one of my advisor's papers. Imagine millions of computers, each
56:05
holding some data. You need to find one specific file. How do you search a network with no central authority? This
56:11
is the problem CAN solves. Napster used a central index server, fast lookups,
56:17
but it was a single point of failure. Nutella flooded every query across the whole network. Resilient, but horribly wasteful. We need something that's both
56:23
decentralized and efficient. Can's key insight create a virtual coordinate space. Think of it as a grid. Each node
56:28
owns a zone of this grid. When a new node joins, it splits an existing zone in half. The grid has nothing to do with physical location. It's purely logical.
56:34
To store data, hash the file name to a point on the grid and store it at whichever node owns that zone. To retrieve it, hash the key again. You get
56:40
the same coordinates and route your request there. Any node can find any data using the So,
56:46
as you can see, this video honestly is pretty excellent in explaining the key idea of my advisor's paper.
56:53
Um in fact I showed it to her and she uh she said so herself that this kind of visualization the particular metaphor I
57:00
choose to draw was really great. Um
57:05
Lewig uh we started off together for the very
57:11
first video just chatting back and forth and very little chatting. I told I wanted to make a YouTube channel that
57:17
was educational. I wanted it to make a YouTube channel that was educational and almost nothing else. I said, "Work on AP
57:22
calculus videos and on some papers from my field, from my lab." It went and looked up those papers. It knew who I
57:29
was. So, looked up uh what lab am I in? Found papers, suggested them. Um then
57:34
went and picked the papers, started making videos about them. It went and discovered that it can use uh the math
57:40
animation library manim created by three blue one brown to make these beautiful animations and render them. Then it
57:46
wrote a script to go along with each scene. figured out how to use the texttovoice API provided by OpenAI
57:52
generated the text the voice if it was too long it uh and I had to give it some
57:58
feedback here its very first attempt um the the voice that generate for each scene would be too long it would sometimes overlap with the next scene so
58:04
I had to tell it by the way make sure not to do this um and then I would stitch everything together with ffmpeg
58:10
and send it to me and I told it by the way can you just upload directly to YouTube and it went found a skill for
58:16
how to upload things to Um, I had to iterate with it for at most
58:22
half an hour of just it generating things. I give it some feedback. Hey, you generate some overlapping text. You
58:27
had some overlapping audio. Can you add a quiz portion to each video that asks you to test your understanding with a
58:33
countdown? And that was it. After that conversation back and forth, it once I was satisfied
58:40
created a skill for itself of how to make these videos. And now it's just been autonomously pumping out videos on
58:46
different topics. Volumes of revolution, discs and washers. Take a curve, spin it around an
58:52
axis, and you get a threedimensional solid. The question is, how do you find its volume? Turns out the answer is beautifully simple.
58:59
Let's start with a familiar curve. y= the roo of x from x= 0 to x= 4. Again, it's pretty cool. I did no review
59:06
of this video. This just appeared on the YouTube channel. So this is the kind of autonomous uh
59:12
processing that that uh cloud code uh that that my open cloud can do.
59:20
Okay, now we've gone to a full hour. Um I'm going to close with some meta observations.
59:27
From looking at this code, I want to say that code quality is dead. Um looking at
59:32
the code itself, it's gross in in OpenClaw. code powering open claw. Um I
59:38
would get fired for writing this kind of code at Google. This would never get kind of merged in. And I think this is a
59:43
function of the new world we live in where implementation abstractions no longer matter. But abstract uh a design
59:50
abstractions do and the architecture I showed you the design of the system is actually quite nice.
59:56
I find it miraculous that this works as well as it does given the poor code quality. But I think it's just showing us that design matters more than
1:00:02
implementation. Now, um, there are some open questions here. What
1:00:10
pieces of the design actually make it so magical? And I I posit that it's the time aspect of being able to schedule
1:00:16
jobs and wake up at certain times and also self-configure
1:00:21
uh, skills which allows it to improve itself. Um,
1:00:27
but this I want to point out this rise of strange loops. you've read uh Douglas
1:00:33
Hopster's book um go to leasherbach a classic that talks about loopiness
1:00:40
strange loops where you can't really tell the loop kind of wraps all the way around to itself where is the start and
1:00:45
where is the beginning it's odd that the agent is becoming the interface for reconfiguring itself through LM calls um
1:00:53
and that kind of full circle moment is very special I think we're very close to kind of a flywheel takeoff here
1:01:00
um a number Open questions. If you follow that loopiness thing that I presented at the beginning, what is the
1:01:06
next layer of wpping? I suspect it's systems that
1:01:12
have a malleable architecture like OpenCloud still has a fixed architecture which makes it good at particular
1:01:18
things. But if even this architecture was something that could self-evolve, now OpenCloud has the ability to edit
1:01:23
its code and so you could use it to self-evolve, but it isn't designed from first principles to be self-evolving.
1:01:30
Um, lots of questions on what makes something a custom agent. What what
1:01:37
layer does that live? If you're spawning lots of cloud codes and that talk in interesting ways, is that a custom agent
1:01:42
or is do you have to be editing the harness for something to be your own agent? What is the layer we should building be building over top of? Um,
1:01:50
I'm wondering quite a bit on the different paradigms for providing capabilities. Curious about how ambiguity is going to be solved. Um, I
1:01:57
suspect it might actually be solved by smart enough models where before people were worried if you don't specify the
1:02:03
thing you need enough, your agent is going to fail. But I think the
1:02:09
the potential new conclusion is actually if a agent is smart enough, approaches
1:02:15
human reasoning, then the same question that you could be able to answer, provide more clearly, it should be able
1:02:20
to answer and provide more clearly if it understands the context. Um
1:02:27
yeah,
1:02:32
and I think I'm I'm going to stop there since we've gotten to a full hour. Um please take a look at the slides.
1:02:37
They'll be linked in the description. Feel free to reach out with any questions. Um, and I'm very excited
1:02:43
about this space and uh I think we're going to see a lot of interesting
1:02:50
autonomous systems coming out in the next six to nine months. Um, these principles
1:02:58
are going to be be able to be built into all sorts of kind of systems out in the real world, which as a systems PhD
1:03:04
student is something I'm very excited about. Um, thanks for watching.
------------------------------------
Claude response:
Six things worth pulling from that talk, ranked by what would actually move Antaeus:

**1. Heartbeat + cron = the "always-present" feeling we're trying to design.**
This is the biggest. Antaeus today is passive — it only does anything when the operator opens a room. OpenClaw's heartbeat (every 30min, check what's drifting) + cron (schedule something for Wednesday 8am) is exactly the mechanism that makes the system feel alive without becoming hallway nav. The birdseye strip we just drew is the visual layer; the heartbeat is the engine that would actually make it pull. "Meridian's evaluation call is tomorrow — discovery has 3 unanswered questions. Want a brief?" — that line never appears without something waking up to check.

**2. Skills as a lightweight authoring primitive — complement to the heavy rooms.**
Rooms are big intentional opinionated surfaces (canon §4). Skills in the OpenClaw sense are tiny markdown recipes — "here's how to do X" — and the community converged on them as more effective than MCP. For Antaeus this could be: small operator-authored workflows like "before-call brief" or "post-loss autopsy" or "weekend deal sweep." Cheap to write, composable, the operator can author their own. Doesn't replace rooms — augments them. The PoC Framework has a "skills" feeling baked in already (proof scope/kickoff/readout/email markdown templates).

**3. The always-present + summoned pattern validates the birdseye direction.**
OpenClaw is doing structurally the same thing we just sketched: ambient quiet surface (heartbeat) + rich on-demand expanded view (Ctrl+K). Our mockup is the right shape. Worth noting.

**4. Session-per-focused-object.**
OpenClaw uses Discord channels as one-session-per-topic. For Antaeus, the natural analog is one session per focused account — every action taken on Meridian, across rooms, in a timeline the system can reason over. Today we have continuity params carrying state between rooms but no first-class "Meridian's session" concept. Could elevate the focused-object trail from "snapshot read across rooms" to "this account's living history + the system's reasoning attached."

**5. Configuration as evolving markdown — soul.md applied to the workspace.**
The Founding GTM Kit (canon §4.19) is already a manually-authored evolving doc — what we've learned about who hits, why we win, etc. OpenClaw's pattern says: let the system write to it too. "We've now closed 3 deals with VP Ops as champion at the $50K band — the founder should know that pattern is real." Less authored, more co-authored.

**6. Inter-room proactive messaging.**
Rooms today can hand off via the CTAs in the HandoffStrip but only when the operator clicks. OpenClaw's inter-session messaging is push, not pull — one session wakes another. Translated: Future Autopsy notices Meridian pattern-matches a past loss → quietly pings the strip while the operator is in Outbound Studio. The birdseye strip becomes the natural place that quiet pings land. (Without the strip, there's nowhere to land them; with the strip, they have a home.)

**What I'd skip:**
- The connectors layer (WhatsApp/Discord/iMessage) — Antaeus is the surface, not accessed through other surfaces.
- Self-modifying architecture — dangerous for a productized workspace; the operator shouldn't wake up to find their rooms rearranged.
- "Code quality is dead" — true for hobbyist agent harnesses, false for shipping product.

The thread connecting #1, #3, #4, #6 is the same thread: **Antaeus needs a heartbeat layer to make the birdseye and the always-present feeling actually mean something.** Right now it's UI ambition with no engine behind it. The OpenClaw lesson is that the engine is cheap — cron + heartbeat tool + a place to land the results. Worth scoping as the layer beneath the birdseye when we get to implementation.
---------------------------------
Antaeus response:
i think you just answered my question around the birdseye nav topic instead of the whole app view.
--------------------------
Claude response:
Fair catch — I framed everything through the birdseye lens. Let me re-answer at the whole-app level.

The OpenClaw architecture isn't really about agents. It's about **what a system that has its own voice across time looks like**. Antaeus today is structurally the opposite: it's a workspace where the user authors and the system stores. Every room is pull, every action is now, the system has no opinions of its own. The OpenClaw lessons worth holding for Antaeus, in roughly the order they'd transform the product:

**1. The system should accumulate its own observations, not just store the operator's input.**
This is the biggest. OpenClaw has soul.md / user.md / agents.md that the system reads AND writes. The operator authors who they are; the system authors what it's learned. For Antaeus: the Founding GTM Kit (canon §4.19) is the seed of this — but it only updates when the operator opens that room. The whole-app reframe is the system writes to its own ledger continuously: "You've closed 3 deals with VP Ops as champion at the $50K band — that pattern is real now." "Tuesday morning replies happen 3x more than Friday afternoon." "Accounts with funding signals reply within 5 days; cold accounts take 12+." These are observations the operator never authored. The system did. They show up in Founding GTM as "the workspace's voice."

**2. Time as a first-class dimension. Antaeus today doesn't believe in the future.**
There's no "remind me Friday," no "check this on Tuesday," no "if next-step date passes without action, surface it." OpenClaw's heartbeat (wake up every 30 min and look around) + cron (schedule something for a specific time) is the engine that makes the system feel alive. For Antaeus: signal decay detection, deal-decay surfacing, scheduled deal reviews, automatic PoC scope draft when a deal moves to evaluation. Without time, every "what's decaying" question requires the operator to navigate; with time, the system surfaces it.

**3. Skills as a light authoring layer beneath the rooms.**
Rooms are heavy. Sacred minds, canon §4, intentional opinionated surfaces. They're the right shape for what they are. What's missing is a lighter authoring layer for composable workflows that CROSS rooms. "Pre-call brief" pulls from Discovery + Deal Workspace + Advisor Deploy and assembles an output. "Weekly pipeline review" surfaces decaying / advancing / stuck deals with the system's read on each. "Post-loss debrief" opens Future Autopsy with the deal preloaded + suggests advisors. Skills are markdown recipes the operator (or admin) can author. The community converged on this over MCP for a reason — it's cheap, plain English, doesn't require code. PoC Framework already has this feeling for its doc templates; it just needs to escape room boundaries.

**4. Sessions as real shared context, not just URL continuity params.**
Today rooms talk via continuity params (returnTo / focusObject / etc.) — but those are URL-string limited. A real session would be: the focused account's current working context, owned at the workspace level, read by every room. If the operator is in Discovery Studio adding learned facts about Meridian and jumps to PoC Framework, PoC starts with the Discovery context loaded: "You learned Wednesday that their committee is CIO + CFO. Want the scope drafted around CIO + CFO sign-off?" That's the room being a lens onto a shared object's state, not a destination with its own private memory.

**5. Inter-room push, not just pull.**
Everything in Antaeus today is pull. Even the Dashboard ranks objects but only when the operator looks. OpenClaw's inter-session messaging suggests rooms can wake other rooms or wake the operator. Future Autopsy notices an open deal pattern-matches a past loss → quietly notifies the operator while they're in Outbound. Signal Console detects a hot signal on an account with an old PoC → PoC's view updates and a notification lands. This requires #2 (heartbeat) + #4 (session) + somewhere to land notifications (which is what the birdseye strip would become).

**6. Selective extensibility — skills + integrations, not rooms.**
Operators don't author rooms. The rooms are the product. But operators COULD author their own skills, their own CRM/calendar/email integrations, their own observations into the workspace's ledger. Bounded extensibility at the right layers.

**7. Bounded self-modification.**
OpenClaw can rewrite its own architecture. That's dangerous for a productized workspace — Sarah shouldn't wake up to find her rooms rearranged. But Antaeus COULD self-edit the observations ledger (#1) and self-tune skills that are being used the same way repeatedly. "You modified the Pre-call brief skill the same way 10 times — want that to be the new default?"

**What I'd pass on entirely:**
- The connectors layer (WhatsApp/Discord/iMessage). Antaeus is the surface; we don't proxy through other surfaces.
- Open-ended self-modification of the architecture itself.
- "Code quality is dead." True for personal hobbyist harnesses; false for a product shipping to non-developers.
- Security-through-reasoning. We have RLS at the DB layer. That's the right shape for a multi-tenant workspace.

---

**The deeper pattern Krentsel is naming:**
*The intelligence of a system is in the orchestration layer, not in the rooms.* Antaeus's canon today is mostly WHAT each room does (the mind, the primitives, the must-never-flatten). A whole-app reframe at the OpenClaw bar would add a parallel canon for HOW the system behaves between rooms and over time — the heartbeat, the session, the observations ledger, the skill registry, the inter-room messaging. That layer is currently absent from Antaeus. The birdseye is just the visible tip of it; the iceberg underneath is what would actually transform the app.

If you want a concrete sequence to commit to as a whole-app evolution, the dependency order is: **session-as-shared-context → heartbeat → observations ledger → skills layer → inter-room push → birdseye surface to expose it all.** Birdseye is the last layer, not the first.
-------------------------
Antaeus response:
on point 1 - what differentiates this from a crm?
on point 2 - i agree
on point 3 - i agree
on pont 4 - i agree
on point 5 - i agree
on point 6  - i agree
on point 7 - interesting

now give me a concrete understanding of what considering making these adjustments would mean for the app as it looks and feels and moves (or doesnt) today
----------------------------
Claude response:
**On the CRM question first.** This is the right thing to defend. The line is sharper than it looks but easy to slide across:

A CRM's observation is a number in a report: "win rate by champion role: VP Ops 78%, CTO 12%." Antaeus's observation is a sentence written like a peer would say it: "VP Ops is the champion role you close on. Three deals at the $50K band confirm the pattern. Don't waste cycles on CTO-led deals at this stage." Same underlying data; entirely different shape.

Five things that keep us out of CRM territory:

- **Format is prose, not metric.** A peer would say "Tuesday mornings get 3x the replies," not show a chart with two bars. The system writes sentences.
- **Sharp, not exhaustive.** A CRM dashboard tries to surface everything. The Antaeus ledger surfaces *one* thing at a time — the read that's actually pulling — the rest stays invisible until pulled.
- **It feeds back into the system's behavior, not just into a report.** A CRM observation lives in a Tuesday-afternoon dashboard the operator may or may not open. An Antaeus observation changes what the system *recommends* — the Dashboard's ranking shifts, the Outbound Studio suggests Tuesday send-windows, the Founding GTM Kit gets a new paragraph in §1. It's a force on the system, not a data point to read.
- **Names the why, not just the what.** A CRM says "5 deals stuck >30 days in evaluation." Antaeus says "5 deals stuck in evaluation. All 5 are missing the decision-maker confirmation step. That's the same pattern from the two losses last quarter." Causal read, not status report.
- **It has a destination — making the workspace inheritable.** The observation isn't "for the operator to feel informed." It's "what the first hire needs to know on Monday morning." Authored, prescriptive, opinionated. CRMs aspire to be neutral systems of record; the Antaeus ledger explicitly takes positions.

The format is the differentiation. If we ship a "Win Rate by Champion Role" chart, we're a CRM. If we ship a paragraph in Founding GTM §1 that says "stop selling to CTOs at this band" — that's Antaeus.

---

**Now the concrete look-feel-movement question.**

I'll be honest about three things: what changes visually, what changes in how the app *feels* to use, and what changes in how the app *moves* over time. Then a fourth section on what stays the same so the canvas of change is clear.

### Look

Most of the app's surface doesn't redesign. The 20 rooms stay. Bright field stays. Serif headline + kicker stays. The voice rule stays.

What's new:

- **The birdseye strip across the top of every room** — already drawn. Quiet by default, expandable.
- **A "what the system noticed this week" card on the Dashboard** — small, dismissable, lives where the Brief lives today. Two or three observations the system wrote on its own. Plain sentences. Each one has a "show me" link that lands the operator on the underlying object.
- **A skill picker — probably folded into Ctrl+K** alongside or in place of the current room directory. Operator types "pre-call brief Meridian" and the system either executes the skill or picks from the matching list. Lightweight markdown recipes, not a marketplace.
- **A next-action tag on objects** — when the system has scheduled itself to do something later ("checking back Friday on the Meridian advance ask"), the deal/account/proof carries a tiny mono tag showing what's queued. Not a chip — a quiet annotation in the topbar row.
- **Inline observation kickers in rooms** — when the system has written something relevant to the focused object, that room shows the observation as a quiet line above the work. Deal Workspace might surface "this deal pattern-matches the Q2 loss to NorthBridge" while the operator is looking at the deal.

That's it on visible new surfaces. Five things. None of them are decorative. Each one is the visible tip of a behavior-layer change.

### Feel

This is where it transforms.

Today Sarah's relationship to Antaeus is *I drive, the system stores.* She types into rooms, the rooms save, she comes back later, the data's still there. The system is a structured filing cabinet with opinions about layout.

After: *the system has been thinking while she was away.* Sarah opens Antaeus Monday morning and the strip already carries the weekend's read. The Dashboard's Brief includes an observation the system authored. There's a notification waiting from Future Autopsy that the system noticed her open deal pattern-matches a past loss. Her Tuesday call has a prep brief the system started drafting Sunday night based on the calendar.

The shift is from a workspace she opens to *check on* into a workspace she opens to *see what's pulling.*

It changes the verb. Today the verb is "use Antaeus." After, the verb is "open Antaeus and see what it's saying."

That doesn't make it loud. The voice rule + the canon's "command-first, not nav-first" still hold. The system still does ONE dominant thing at a time. But it's authored, not silent.

The feel is closer to having an analyst-coworker who reads the room while you were out, leaves a quiet note on your desk, and lets you decide what to do.

### Movement

This is the biggest break from today.

Today Antaeus does nothing when the operator isn't there. Zero background motion. Sarah closes the tab Friday at 5pm; the workspace is frozen in that state until she reopens it.

After: Antaeus *moves on its own.*

Concrete examples of what motion looks like:

- **Signal decay.** Sunday afternoon a Series C announcement from 30 days ago crosses its expiration threshold. The system writes an observation: "Meridian's Series C signal is now stale. It's been the loudest event on this account for 4 weeks; if it's still the loudest, the account is going cold." Sarah sees that Monday in her Brief.
- **Next-step date passed.** Wednesday at 8am the deal's "follow up by 6/4" date crosses without action. The system surfaces the deal in red on the Dashboard, writes a deal-state line in the strip when Sarah opens any room: "Meridian's follow-up was due yesterday. You haven't acted."
- **Scheduled prep.** Sarah's calendar shows a Friday 2pm Meridian call. The system, knowing the call is in 24 hours, runs the pre-call brief skill Thursday night and lands the output as a card on the Dashboard Friday morning: "Tomorrow's Meridian call — discovery has 3 unanswered questions, decision-maker confirmed, advance ask still blank. Want the agenda?"
- **Pattern match.** Wednesday Sarah closes-lost a deal to NorthBridge. The system runs the autopsy generator overnight, notices the pattern (no advisor backchannel, evaluation stage, CTO-led decision), and Friday morning surfaces a card in the Dashboard: "This was your second loss this quarter on CTO-led evaluations without advisor air cover. Founding GTM §5 has been updated."
- **Cross-room push.** Sarah is in Outbound Studio Thursday afternoon. The system has just detected that her open Pioneer Health deal has crossed its 45-day stale threshold. The birdseye strip pings: "Pioneer Health hasn't moved in 45 days. Future Autopsy will autorun tomorrow unless you intervene."

The app has a heartbeat now. It looks around every 30 minutes. Time passes on the system, not just on the clock.

### What stays the same

So the canvas of change is clear:

- The 20 rooms, their minds, their primitives (canon §4 — all sacred)
- The Dashboard as the ranking surface (canon §4.2)
- Bright field, serif headlines, kicker pattern (canon Part II)
- Voice rule (canon Part III §11 — including the v2 dictionary we just locked)
- Continuity params + RoomChrome + cmd/Ctrl+K palette
- Sacred nouns (account, deal, signal, proof, focus, advisor, call) (canon §2)
- Object-first / command-first / sacred-noun architecture (canon §3)
- Behavioral engineering principles (canon Part III §1-9)
- Supabase + RLS + workspace-scoped data
- Bright, severe, composed, authored emotional territory (canon §1)

What changes is the **orchestration layer beneath the rooms.** Today there isn't one. After, there's a real one: a heartbeat process, a session as a real object, an observations ledger, a skill registry, an inter-room event bus, push-to-operator notifications.

### Honest cost

This is real engineering. It's not "polish the UI." Concretely it adds:

- A backend job runner (Cloudflare Workers cron triggers + Supabase scheduled functions can do this without new infra)
- A session model that lives at the workspace level (new table + cross-tab consistency)
- An observations ledger (new table + a writer-LLM call on cron + a renderer)
- A skill registry (new table or markdown files in Supabase storage + an executor)
- An event bus or notification queue (Supabase realtime can do this)
- A renderer for the birdseye strip + the inline observation kickers + the next-action tags

These compose. None of them are research projects. But it's months of work, not weeks, and it adds a whole layer the canon doesn't currently address.

If you want to feel the shape of it before committing, the smallest payload that proves the direction is real: **ship the heartbeat + observations ledger first, with the only visible surface being a "this week's reads" card on the Dashboard.** That alone changes the feel of the app from passive to authored. Everything else (birdseye strip, skills, inter-room push) layers on top once the engine exists.
----------------
Antaeus response:
on skill picker - does that mean we'd be writing up new 'skills' docs and/or agents?
---------------
Claude response:
Yes to skills docs. No to agents (in the OpenClaw sense). The distinction matters and Antaeus diverges from OpenClaw on this one.

**What a skills doc would actually look like:**

```markdown
---
name: pre-call-brief
description: Assembles the brief for an upcoming call on the focused account
inputs: focused-account
output: card on Dashboard
---

# Pre-Call Brief

Pulls and composes:
- Discovery Studio's unanswered questions for {{account}}
- Deal Workspace's vitals (decision-maker, decision process, stage, next step)
- Advisor Deploy's coverage on {{account}}
- Call Planner's agenda for the next scheduled call

Renders a 1-page brief with sections:
- Who's in the room
- What we learned last call
- What's still unknown
- What to ask for at the end

Surfaces on the Dashboard 24 hours before the scheduled call (via heartbeat).
```

That's the whole file. Markdown, plain English, cheap to author. The operator (or admin) reads it like a recipe; the system reads it like a config.

**What it isn't:**

In OpenClaw, skills are text the LLM reads at runtime to decide what to do. Antaeus today has no LLM at runtime — every engine (the Dashboard's command-intelligence ranking, the PoC Framework's doc generators, the Outbound Studio's send-line builder) is deterministic hand-written code. If we adopt skills, they should compose those existing deterministic engines, not summon an LLM to interpret instructions.

So an Antaeus skill is a markdown recipe that the runtime parses → reads the named engines → composes the output via a template. Predictable, repeatable, no surprise behavior.

**The decision you'd actually need to make:**

Whether Antaeus skills should ever be LLM-powered. Three options:

1. **Pure deterministic** (composes existing engines only). Safest, most predictable, matches Antaeus's current trust model. The Pre-call brief above works fine this way.
2. **Hybrid** (deterministic by default; LLM-powered when the skill explicitly opts in — e.g. "Generate a personalized email" needs an LLM because no deterministic engine can write English well enough).
3. **Full LLM** (every skill is just instruction text the LLM follows).

My read: option 1 is the right starting point. Option 2 can come later for the handful of skills where deterministic logic genuinely can't do the work. Option 3 isn't Antaeus — that's CRM-with-AI territory we've been careful to stay out of.

And no, no new agents. Skills compose engines; they don't summon decision-makers.
------------------------
Antaeus response:
option 1 then. Everything else you talked about. Build it.
-------------------------
Claude response:
Approved. Locking the sequence before I start writing code so we don't end up half-built.

**Prerequisite — land what's already done on main first.** The orchestration code will use `focuses` (not `theses`), follow the new voice rule, and reference the birdseye design we just drew. If we build on a branch that hasn't merged those, every new PR fights merge conflicts. Two small PRs first:

1. **Voice deep-clean v2 → main** (already 4 commits, all gates green; squash-merge same as v1).
2. **Birdseye mockup → main** (one HTML deliverable; merge as design artifact in the mockups archive).

Once those are on main, the orchestration build runs in phases. Each phase is its own branch + PR. Each phase ships visible value — nothing sits half-built between phases.

**Phase A — Foundation (invisible to operator).**
- Session model: workspace-scoped session object + cross-tab consistency
- Heartbeat: server-side cron via Cloudflare Workers cron triggers + Supabase scheduled functions
- Observations ledger: new Supabase table + writer infrastructure
- Tests, gates, canon update to document the new orchestration layer

**Phase B — First observable signal.**
- One observation generator (signal-decay detection — easy to test)
- "This week's reads" card on the Dashboard
- The system starts visibly writing observations of its own

**Phase C — Skills layer (option 1: pure deterministic).**
- Skills as markdown files (storage + parser + executor)
- Skill executor composes existing engines, no LLM at runtime
- Skill picker folded into Ctrl+K palette
- Ship 3-5 starter skills: pre-call brief, weekly pipeline review, post-loss debrief, outbound batch, weekend deal sweep

**Phase D — Birdseye strip + inter-room push.**
- Strip mounts on every room, wired to session + observations + notification queue
- Inline observation kickers appear in rooms when relevant to the focused object
- Next-action tag pattern on objects

**Phase E — Cron + operator scheduling.**
- Operator can schedule reminders ("ping me Friday about Meridian's follow-up")
- Skills that auto-run on schedule (pre-call brief fires 24h before the calendar event)
- The full "Antaeus has a calendar" feeling

**Phase F — Bounded self-modification.**
- System refines skill defaults based on operator usage patterns
- System proposes new observations as patterns emerge
- The speculative tail; least essential, most experimental

**Honest scope.** This is months of work across many sessions. Phase A alone is probably 8-12 hours; the whole arc is ~80-120 hours. Each phase produces a real shippable capability, so we can stop or reorder at any phase boundary without leaving anything broken.

**One thing to confirm before I start:** is the sequence right, or do you want to swap something? The most likely reorder: Phase D before Phase C (ship the empty strip first as the surface, then the skills that fill it). Otherwise the order above is dependency-driven and tight.

If the sequence is right, I'll:
1. Open the v2 PR and squash-merge to main
2. Open the mockup PR and merge to main
3. Cut a fresh branch off main and start Phase A

Say go, or name the reorder.
-----------------------------------------
Antaeus response:
go with phase a
------------------------------------
Claude response:
Going. Step 1: land the prerequisite PRs.

Clean tree. Opening the v2 PR + merging it first, then the mockup PR.

PR #132 opened. Squash-merging:

Merged as `9ef1055`. Now the mockup PR:

Both merged. Sync local main + cut Phase A branch:

On the new branch. Phase A starts. Let me inventory the existing infrastructure I'll be building on:

Clean foundation. Phase A scaffolding starts now. Order: ADR-004 (the WHY), Supabase migrations (storage), TypeScript session model, observations infrastructure, heartbeat skeleton, canon update. I'll commit at meaningful checkpoints so we can see progress shape.

**Step 1: ADR-004 — the doctrine for the new orchestration layer.**

**Step 2: Supabase migrations for the two new tables.**

**Step 3: Update database.types.ts to expose the two new tables.**

Now I also need to add the `dismiss_observation` function to Functions:

Clean. Now add data-client accessors for the two new tables:

Foundation gates green. Commit checkpoint 1 — schema layer + types — then continue with the TypeScript session model:

**Checkpoint 2: TypeScript session model — types, state, helpers, tests.**

`RealtimeChannel` has `.unsubscribe()`. Fixing `helpers.ts` to use `where` instead of `filter` and the correct types:

Now the helpers test — using a mock DataClient that records all calls:

39 new session tests, full suite 1802/1802. Commit checkpoint 2:

**Checkpoint 3: Observations infrastructure (reader + writer interface + tests).**

Clean. Now tests for the observation layer:

19 new observation tests, full suite 1821/1821, typecheck clean. Commit checkpoint 3 + continue:

**Checkpoint 4: Heartbeat Edge Function skeleton.**

Gates green. Commit checkpoint 4:

**Checkpoint 5: Canon CLAUDE.md update + Phase A close.**

Now update Part V §1 (current state) with the Phase A entry:

Now add to Part V §6 session log:

All green. Commit checkpoint 5 + close Phase A:

Push the branch and report:

**Phase A is done.** Pushed on `claude/orchestration-phase-a`. Five commits, all green:

| # | Checkpoint | What landed |
|---|---|---|
| 1 | Schema | ADR-004 + `workspace_sessions` + `observations` Supabase tables + RLS + Realtime + dismiss_observation RPC + database.types.ts updates + data-client accessors |
| 2 | Session model | `src/lib/session/` — types + signals + bootSession/setFocusedObject/clearFocus/pushRecentAction helpers + 39 tests |
| 3 | Observations infrastructure | `src/lib/observations/` — types + reader (listObservations + dismiss) + writer (dedupe + supersession + runGenerator) + 19 tests |
| 4 | Heartbeat | Deno Edge Function with empty registry + active-workspace filter + structured report + pg_cron schedule migration (commented out for staged rollout) |
| 5 | Canon close | CLAUDE.md Part II.5 §7 (new orchestration-layer section) + Part V §1 callout + session log entry |

**Final state:**
- typecheck clean
- vitest 1821/1821 (+58 from baseline)
- Playwright still 260/260 (no UI changes — Phase A is invisible by design)
- Phase A is the foundation; the system has the schema, the session model, the observation writer + reader, and a heartbeat skeleton ready to register generators

**What's NOT done yet (by design):**
- No generators registered. The heartbeat runs but writes nothing.
- No rooms wired to the session model. Continuity params still carry context today; rooms read from the session in Phase D.
- No visible UI surfaces. The Dashboard's "this week's reads" card lands in Phase B.

**Founder action items before Phase B can start writing real observations:**
1. Apply the three new Supabase migrations (`20260519180000`, `20260519180001`, `20260519180002`) to production.
2. Deploy the Edge Function: `supabase functions deploy heartbeat --no-verify-jwt`
3. Set the DB settings: `app.heartbeat_url` + `app.service_role_key`
4. Uncomment the `cron.schedule(...)` call in migration 02 and re-apply.

Want me to open the PR for Phase A → main now, or hold until you've applied the migrations + deployed the function so we can verify the cron in production first?
--------------------------------