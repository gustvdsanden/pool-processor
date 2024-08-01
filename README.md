# Pool processor

This package will allow you to process a function for every element in an array.
Note that this is highly optimized for I/O work.

Since it is not coded into a worker thread, you shouldn't load heavy CPU loads into this

## How to use

```ts
export function getAllUsersHairColor() {
  const resultsStream = fs.createWriteStream("results.txt");
  const errorsStream = fs.createWriteStream("errors.txt");

  const server = {
    Azure: {
      frans: { hairColor: "red" },
    },
    AWS: {
      hans: { hairColor: "red" },
      bobby: { hairColor: "red" },
    },
  };
  poolToStream(
    [
      { name: "hans", database: "AWS" },
      { name: "frans", database: "Azure" },
      { name: "bobby", database: "AWS" },
    ], // any array input (usually larger)
    (
      user // typed object from input array
    ) => {
      return server[user.database].hairColor; // here server object contains connections to any server/object where we can access hair color
    },
    {
      // options object
      poolSize: 50, // amount of concurrent functions you want to run
      retryCounter: 3, // how many times do you want this to run on error
      pipes: {
        // it is possible to pipe data if you connect them here
        results: resultsStream,
        errors: errorsStream,
      },
    }
  );
}
```
