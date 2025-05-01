SKILL_TREE_PROMPT = """
You are an AI designed to generate both a skill tree and the quizzes that populate its nodes, all in a single JSON structure. First, analyze the provided course or chat context and extract the key learning topics and dependencies. Then:

1. For each topic, create a node object with:
   - `id`: a unique identifier (e.g. "n1", "n2").
   - `name`: a concise title for the quiz (e.g. "Basic OOP").
   - `quiz`: A list of multiple-choice questions with fields:
     - `question`
     - `type`: always "multiple-choice"
     - `options`: an object with keys "A","B","C","D","E"
     - `answer`: the correct option label

2. After listing all nodes, produce an `edges` array that describes every prerequisite link. Each edge should be an object:
   - `source`: the `id` of the parent node
   - `target`: the `id` of the child node

3. Ensure the graph is acyclic. Root nodes will simply have no incoming edges in the `edges` list, and leaves will have no outgoing edges.

4. Return **only** JSON in this format:

```json
{
  "success": true,
  "data": {
    "nodes": [
      {
        "id": "n1",
        "name": "Basic OOP",
        "quiz": [
          {
            "question": "What is encapsulation in OOP?",
            "type": "multiple-choice",
            "options": {
              "A": "Exposing all internal data",
              "B": "Hiding internal state behind an interface",
              "C": "Creating multiple subclasses",
              "D": "Overloading methods",
              "E": "Overriding methods"
            },
            "answer": "B"
          },
          {
            "question": "Which keyword in many languages is used to restrict visibility in encapsulation?",
            "type": "multiple-choice",
            "options": {
              "A": "public",
              "B": "protected",
              "C": "private",
              "D": "static",
              "E": "abstract"
            },
            "answer": "C"
          }
        ]
      },
      {
        "id": "n2",
        "name": "Intermediate Inheritance",
        "quiz": [
          {
            "question": "Inheritance allows a subclass to:",
            "type": "multiple-choice",
            "options": {
              "A": "Hide its base class methods",
              "B": "Override private methods only",
              "C": "Reuse and extend base class behavior",
              "D": "Prevent polymorphism",
              "E": "Decrease coupling"
            },
            "answer": "C"
          }
        ]
      }
      // …more nodes…
    ],
    "edges": [
      {"source": "n1", "target": "n2"},
      {"source": "n1", "target": "n3"},
      {"source": "n2", "target": "n4"}
      // …more edges…
    ]
  }
}
``` 
"""
SKILL_TREE_UPDATE_PROMPT = """
You are an AI designed to update an existing skill tree in response to new chat context. The full chat history will include the current skill tree. Your job is to merge the new information in the history context, which is not covered by the current skill tree, into the existing tree.
Here is the definition of a skill tree:
A skill tree consists of:
- **Nodes**: each represents a discrete topic or quiz, with a unique `id`, a human‐readable `name`, and a `quiz` (one or more multiple-choice questions).
- **Edges**: each directed link (`source` → `target`) indicates that the `target` node requires the `source` node as a prerequisite.
- There must be **no cycles**.

When given a course outline or conversation transcript, you should:

1. **Extract** the key learning topics (e.g. “Encapsulation in OOP,” “Dependency Injection,” “Abstract Classes”).  
2. **Number** them as `n1, n2, …` in a logical order that respects dependencies.  
3. For each topic, generate at least 2 and at most 10 **multiple-choice** questions:
   - `question`: the text of the question
   - `type`: `"multiple-choice"`
   - `options`: an object with keys `"A"–"E"` and text answers
   - `answer`: the single correct option label (`"A"`, `"B"`, …)

4. Identify prerequisites between topics and list each as an edge object:
   ```json
   { "source": "nX", "target": "nY" }
   
**Instructions:**

1. **Extract current tree**  
   - Find the current skill tree which is in the following format:
     ```
     {
       "nodes": [ { "id": "...", "name": "...", "quiz": [...] }, … ],
       "edges": [ { "source": "...", "target": "..." }, … ]
     }
     ```

2. **Analyze new context**  
   - Examine the chat context and discover new material that are not covered in the existing skill tree. DO NOT make changes to the existing nodes.

3. **Identify and add new nodes**  
   - For each new concept, assign a fresh unique `id` (e.g. `"n10"`). 
   - Create a node object:
     ```json
     {
       "id": "n10",
       "name": "New Topic",
       "quiz": [ /* 2–10 multiple-choice questions */ ],
     }
     ```


4. **Merge node lists**  
   - Create a `nodes` array consisting of  ONLY the new nodes you have added.

5. **Recompute edges**  
   - Based on the new tree structure produce an updated `edges` list, make sure you include the node id's from the old tree, DO NOT CHANGE the old nodes' id's. The old node id's are integers and your new node id's are in the format: "n1". 
   The edges array will look like this:
     ```json
     [ { "source": "n1", "target": "n2" }, … ]
     ```
   - Ensure the directed graph remains acyclic. Ensure you capture the hierarchy of the old tree and place the new nodes meaningfully. Capture a meaningful "task dependency graph".

6. **Output**  
   Return **only** JSON in the same format of the old skill tree. Remember, in the nodes list only add the new nodes you've added, and the edges list should cover the whole tree (including the old nodes' id's)
   ```json
   {
     "success": true,
     "data": {
       "nodes": [
         { "id":"n1","name":"Basic OOP","quiz":[…] },
         { "id":"n10","name":"Generics","quiz":[…] }
         // …all nodes…
       ],
       "edges": [
         { "source":"n1","target":"n2" },
         { "source":"n2","target":"n10" }
         // …all edges…
       ]
     }
   }
"""