---
id: "001426"
title: The graph builds up node by node
kind: functional
status: draft
owner: frederikbeimgraben
updated: 2026-11-22
implementation: null
scope:
  - views/graph
---
# The graph builds up node by node

The page must load the graph in pages of at most 60 nodes, the newest nodes first. The page
must load the next page by itself until 300 nodes show. Then the action "Mehr laden"
(`Load more`) must load the next 300. A change of a filter must start the build-up again.

The drawing must show the loaded nodes one at a time, never a page at once. Each loaded node
goes into a queue, and the drawing takes the next node from the queue after a pause. The pause
is 3600 ms divided by the number of waiting nodes, at least 30 ms and at most 120 ms: 120 ms
while at most 30 nodes wait, shorter for a longer queue, so that 300 nodes show in less than
20 s. The next node is the first node in the queue that has a neighbour that already shows;
when no node has one, it is the first node in the queue. Each node must appear with a short
scale-in next to a neighbour that already shows, and its lines must appear together with it. The nodes that already show must
keep their place, apart from the settling of the layout. A page that arrives while the queue
is not empty goes to the end of the queue.

With reduced motion, 001427 applies: each page shows at once at its final place.

Reason: The person watches the structure grow one element at a time instead of in batches of
a page. A node that joins next to a neighbour keeps the build-up connected. The shorter pause
for a long queue keeps the wait for a full drawing short. The stop at 300 keeps the drawing
readable and the browser fast.

Test: A frontend unit test feeds two pages and checks that the nodes of the first page keep
their identity, that the drawing adds one node per pause in the order of this spec, and that
the page stops at 300 nodes.
