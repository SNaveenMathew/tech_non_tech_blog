---
layout: post
date: 2021-10-31 12:00:00 -0500
image: ../data/R_troll.jpg
---

## Does python prioritize True in 'OR' and False in 'AND' condition checks?

### Background

I found this meme on LinkedIn recently. After reading this post I hope people feel the same about python.

<figure>
  <img src="../../../data/R_troll.jpg">
  <figcaption></figcaption>
</figure>

### Experimenting with 'AND'

Let's assume we have a simple function in python to check if all the numbers in a list are greater than a threshold. Logically the function should return False if any number in the list violates the condition. Therefore, a single False is sufficient to make all([..., False, ...]) return a False. Similarly, a single True is sufficient to make any([..., True, ...]) return a True. Therefore, if 'n' is the length of the list, the number of steps required to determine the output should be strictly less than or equal to n. However, things may become interesting if we use a recursive function instead of a loop to obtain the result. Consider the following function:

```
def all_greater(nums, threshold):
  len_nums = len(nums)
  print(1)
  if len_nums == 1:
    return nums[0] > threshold
  else:
    return (nums[0] > threshold and all_greater(nums[1:], threshold))

all_greater([1], 0)
```

Output:

```
1
True
```

It is well known that recursive functions use a "call stack". Consider the following function call and try to reason how many times print(1) will be executed:

Surprisingly (or unsurprisingly), the answer is — just once! Let's change the order of conditions under 'else' and see what happens:

```
def all_greater(nums, threshold, num_calls = 1):
  len_nums = len(nums)
  if num_calls>=100:
    print(num_calls)
  if len_nums == 1:
    return nums[0] > threshold
  else:
    return (nums[0] > threshold and all_greater(nums[1:], threshold, num_calls = num_calls + 1))

all_greater([x for x in range(100)], 100)
```

Output:

```
False
```

```
def all_greater(nums, threshold, num_calls = 1):
  len_nums = len(nums)
  if num_calls >= 100:
    print(num_calls)
  if len_nums == 1:
    return nums[0] > threshold
  else:
    return (all_greater(nums[1:], threshold, num_calls = num_calls + 1) and nums[0] > threshold)

all_greater([x for x in range(100)], 100)
```

Output:

```
100
False
```

Surprisingly, the function was called 100 times! Despite the fact that and([A, B]) == and([B, A]), and nums[0] > threshold is violated for the very first index, the recursive call was made to the function. Therefore, we can conclude that the statement on the left is given preference during the evaluation of 'and' condition.

### Experimenting with 'OR'

```
def any_greater(nums, threshold, num_calls = 1):
  len_nums = len(nums)
  if num_calls >= 100:
    print(num_calls)
  if len_nums == 1:
    return nums[0] > threshold
  else:
    return (all_greater(nums[1:], threshold, num_calls = num_calls + 1) and nums[0] > threshold)

all_greater([x for x in range(100)], 100)
```

Output:

```
100
False
```

Unsurprisingly, the same pattern is observed with True and 'OR'. However, it only gets more mysterious from here.

### Enter numpy

#### More experiments with 'AND'

```
import numpy as np
False and np.nan
np.nan and False
True and np.nan
np.nan and True
```

Outputs:

```
False
False
nan
True
```

This arises naturally from the following:

False and A = A and False = False

True and A = A and True = A

#### More experiments with 'OR'

```
import numpy as np
False or np.nan
np.nan or False
True or np.nan
np.nan or True
```

Outputs:

```
nan
nan
True
nan
```

False or A = A or False = A

True or A = A or True = True

Surprisingly, np.nan or True -> nan! This contradicts A or True = True. At present I'm unable to think of a reasonable explanation for this result.

#### The mystery does not end there

```
import numpy as np
np.logical_and([False]*10, [np.nan]*10)
np.logical_and([np.nan]*10, [False]*10)
np.logical_and([True]*10, [np.nan]*10)
np.logical_and([np.nan]*10, [True]*10)
np.logical_or([False]*10, [np.nan]*10)
np.logical_or([np.nan]*10, [False]*10)
np.logical_or([True]*10, [np.nan]*10)
np.logical_or([np.nan]*10, [True]*10)
```

Outputs:

```
array([False, False, False, False, False, False, False, False, False, False])
array([False, False, False, False, False, False, False, False, False, False])
array([True, True, True, True, True, True, True, True, True, True])
array([True, True, True, True, True, True, True, True, True, True])
array([True, True, True, True, True, True, True, True, True, True])
array([True, True, True, True, True, True, True, True, True, True])
array([True, True, True, True, True, True, True, True, True, True])
array([True, True, True, True, True, True, True, True, True, True])
```

Mysteriously, all the statements resulted in True / False outputs. The most intriguing results were:

```
import numpy as np
np.logical_or(False, np.nan)
np.logical_or(np.nan, False)
```

Outputs:

```
True
True
```

While np.nan.__bool__() -> True explains all these observations, it does not explain why np.nan or True -> nan instead of True (simplified).

### Conclusion

Logical 'OR' and 'AND' statement in python seem to execute the statement on the left before executing the statement on the right. "A and False = False and A = False" and "True or B = B or True = True" can reduce the number of call stacks in a recursive function if the output is simply 'and([List])' or 'or([List])'.

Handling missing boolean values in numpy is not very intuitive. Using numpy's logical_and / logical_or may lead to inconsistent outputs that may pass unit tests, but can lead to incorrect results during runtime.

### Additional Reading

Please look at the following articles for more interesting observations on python's handling of logical expressions:

- https://peterbbryan.medium.com/3-curiosities-of-python-booleans-c45379827c6c
- https://dbader.org/blog/difference-between-is-and-equals-in-python
