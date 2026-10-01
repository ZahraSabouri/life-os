# CMT307 Lab 1 Exercise 1 Study Notes

Notebook:

`Session 1 Machine learning overview & data preprocessing/Practical 1/CMT307Lab1Ex1.ipynb`

This notebook introduces a basic machine learning workflow using the Iris dataset.

The main flow is:

```text
1. Get data
2. Split data into input X and output y
3. Split into training and test data
4. Explore the data
5. Preprocess/scale the data
6. Train a model
7. Make predictions
8. Measure accuracy
9. Show another way to load the Iris dataset
```

## Libraries Used

```python
from sklearn import datasets, svm
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import pandas as pd
```

`sklearn` is short for scikit-learn. It is a Python machine learning library.

It is used for things like:

- loading datasets
- preprocessing data
- splitting data into train/test sets
- training models
- making predictions
- evaluating model performance

`datasets` gives access to example datasets such as Iris.

`svm` gives access to Support Vector Machine models.

`train_test_split` splits data into training and testing parts.

`matplotlib.pyplot` is used for plotting graphs.

`pandas` is used for table-like data handling and display.

## Pandas Display Option

```python
pd.set_option('display.max_columns', None, 'max_colwidth', None, 'display.expand_frame_repr', False)
```

This is not part of machine learning itself. It only changes how pandas displays tables in the notebook.

It helps show all columns and prevents awkward line breaks.

## Iris Dataset

```python
iris = datasets.load_iris()
```

This loads the Iris dataset from scikit-learn.

Iris is a famous small machine learning dataset about iris flowers.

It contains 150 flower samples. Each sample has 4 input features:

```text
sepal length
sepal width
petal length
petal width
```

The target/output is the flower species:

```text
0 = setosa
1 = versicolor
2 = virginica
```

The task is:

```text
Given flower measurements, predict the iris species.
```

## Viewing The Raw Data

```python
print(iris.data)
print(iris.target)
```

`iris.data` contains the input measurements.

`iris.target` contains the correct class labels.

For example:

```text
X/input = flower measurements
y/output = correct flower species
```

## X And y

```python
X = iris.data
y = iris.target
n = X.shape[0]
print(n)
```

In machine learning, `X` usually means the input features.

`y` usually means the target/output labels.

For Iris:

```text
X = sepal length, sepal width, petal length, petal width
y = flower species
```

`X` does not mean the x-axis of a graph here.

`y` does not mean the y-axis of a graph here.

They mean:

```text
X = data used to make predictions
y = answer we want the model to learn/predict
```

`X.shape[0]` gives the number of rows/examples in `X`.

For Iris, this is 150.

## Train And Test Data

```python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)
```

This splits the full dataset into training data and test data.

Training data is used to teach the model.

Test data is used to evaluate the model after training.

The split creates:

```text
X_train = input features used for training
X_test  = input features used for testing
y_train = correct labels used for training
y_test  = correct labels used for testing
```

`test_size=0.3` means:

```text
70% of the data is used for training
30% of the data is used for testing
```

The reason for splitting is important.

In the Iris dataset, we already have the correct answers for the whole dataset. We split it so the model learns from one part, then we test it on another part.

During prediction, the model sees only `X_test`.

It does not see `y_test`.

After prediction, we compare the model's predictions with `y_test`, which acts like a hidden answer key.

## random_state

```python
random_state=42
```

The train/test split is random.

Without `random_state`, a different random split may happen every time the notebook runs.

That could slightly change the final accuracy each time.

Using `random_state=42` fixes the randomness, so the same rows go into the training and test sets every time.

The number `42` is not mathematically special. It is just a common arbitrary choice.

Other numbers would also work:

```python
random_state=0
random_state=1
random_state=123
```

The key idea is:

```text
Same random_state number = same random split again
```

## EDA

EDA means Exploratory Data Analysis.

It means looking at and understanding the data before modelling.

```python
print(iris.DESCR)
```

This prints information about the Iris dataset, such as:

- what the dataset is
- how many examples it has
- what the features mean
- what the target classes are

## Plotting The Data

The notebook plots petal length against petal width:

```python
plt.plot(X_train[y_train==0, 2], X_train[y_train==0, 3], "bs")
plt.plot(X_train[y_train==1, 2], X_train[y_train==1, 3], "g^")
plt.plot(X_train[y_train==2, 2], X_train[y_train==2, 3], "y*")
plt.xlabel("Petal length", fontsize=12)
plt.ylabel("Petal width", fontsize=12)
```

Here:

```python
X_train[:, 2]
```

means the third feature column: petal length.

```python
X_train[:, 3]
```

means the fourth feature column: petal width.

The conditions:

```python
y_train == 0
y_train == 1
y_train == 2
```

select one species at a time.

The style strings mean:

```text
"bs" = blue squares
"g^" = green triangles
"y*" = yellow stars
```

This graph helps show whether different species are visually separable using petal length and petal width.

## Scaling

```python
from sklearn.preprocessing import MinMaxScaler

scaler = MinMaxScaler()
scaler.fit(X_train)
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

Scaling means changing the input numbers into a similar range.

`MinMaxScaler` usually changes values into the range:

```text
0 to 1
```

Example idea:

```text
Original values: 1.0, 3.5, 6.9
Scaled values:   0.0, 0.42, 1.0
```

Scaling is useful because many machine learning models care about distances between points.

If one feature has much larger numbers than another, it can dominate the model unfairly.

Scaling helps make features more comparable.

Important detail:

```python
scaler.fit(X_train)
```

The scaler learns the minimum and maximum values from the training data only.

Then the same scaler is used on both training and test data:

```python
X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)
```

This avoids letting the test data influence training.

## SVM And SVC

```python
clf = svm.SVC()
```

This creates an empty Support Vector Classifier.

`clf` is just a variable name. It is short for classifier.

This would mean the same thing:

```python
model = svm.SVC()
```

At this point, the model has not learned anything yet.

It is just ready to be trained.

## What Is A Model?

A model is something that learns patterns from data.

For Iris, the model learns patterns between:

```text
flower measurements -> flower species
```

## What Is A Classifier?

A classifier is a model that predicts categories/classes.

For Iris, the classes are:

```text
setosa
versicolor
virginica
```

Other classification examples:

```text
spam or not spam
purchase or no purchase
sick or healthy
```

## Support Vector Machine

An SVM tries to separate classes by drawing a boundary between them.

Imagine flower points on a graph:

```text
Class A points | boundary | Class B points
```

SVM tries to place the boundary so the classes are separated well.

The important points near the boundary are called support vectors.

They strongly influence where the boundary goes.

Simple meaning:

```text
Support vectors = important points near the class border
Machine = algorithm/model
Support Vector Machine = model that uses important border points to separate classes
```

`SVC` means Support Vector Classifier.

It is the classification version of SVM.

## Training The Model

```python
clf.fit(X_train_scaled, y_train)
```

This is where the model learns.

`clf` is the classifier/model.

`X_train_scaled` is the scaled training input data.

`y_train` is the correct answer for each training example.

This line means:

```text
Train the SVM classifier using the training flower measurements and their correct species labels.
```

Example idea:

```text
X_train_scaled row = [0.2, 0.5, 0.1, 0.0]
y_train label      = 0
```

The model learns that this kind of measurement pattern belongs to class `0`, which means setosa.

## Making Predictions

```python
y_pred = clf.predict(X_test_scaled)
```

This uses the trained model to predict labels for the test data.

The model is given only:

```python
X_test_scaled
```

It predicts:

```python
y_pred
```

Example:

```text
y_pred = [0, 1, 1, 2, 0]
```

These are the model's predicted species labels.

## Accuracy Score

```python
from sklearn.metrics import accuracy_score
```

This imports the `accuracy_score` function.

`metrics` means tools for measuring model performance.

So this line means:

```text
Bring in the function that calculates prediction accuracy.
```

Then:

```python
accuracy_score(y_test, y_pred)
```

compares:

```text
y_test = real correct answers
y_pred = model predictions
```

Example:

```python
y_test = [0, 1, 2, 2, 0]
y_pred = [0, 1, 1, 2, 0]
```

Compare one by one:

```text
0 == 0 correct
1 == 1 correct
2 == 1 wrong
2 == 2 correct
0 == 0 correct
```

So:

```text
4 correct out of 5 = 0.8 = 80%
```

Accuracy answers:

```text
Out of all test examples, what percentage did the model classify correctly?
```

Accuracy is useful because training a model is not enough. We need to evaluate whether it works well on data it did not train on.

## Another Way Of Loading Iris Data

The notebook also shows:

```python
from ucimlrepo import fetch_ucirepo
```

`ucimlrepo` is a Python package for loading datasets from the UCI Machine Learning Repository.

The UCI Machine Learning Repository is a well-known online collection of machine learning datasets.

```python
iris = fetch_ucirepo(id=53)
```

This fetches the Iris dataset from UCI.

`id=53` means dataset number 53, which is Iris.

Then:

```python
X = iris.data.features
y = iris.data.targets
```

separates the data into:

```text
X = input feature columns
y = target/output labels
```

Then:

```python
print(iris.metadata)
```

prints information about the dataset.

And:

```python
print(iris.data)
```

prints the dataset contents.

This final section is not training a new model. It only shows another way to load the same Iris dataset.

Comparison:

```text
datasets.load_iris()
= built into sklearn, easy and local

fetch_ucirepo(id=53)
= fetches the dataset from UCI, often with metadata and pandas-style dataframes
```

## Whole Notebook In One Simple Summary

```text
Load the Iris flower dataset.
Separate measurements into X and species labels into y.
Split the data into training and test sets.
Look at the data and plot some features.
Scale the input values.
Create an SVM classifier.
Train it with X_train_scaled and y_train.
Predict labels for X_test_scaled.
Compare predictions with y_test using accuracy_score.
Show that Iris can also be loaded from UCI.
```

## Key Code Flow

```python
iris = datasets.load_iris()

X = iris.data
y = iris.target

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.3, random_state=42
)

scaler = MinMaxScaler()
scaler.fit(X_train)

X_train_scaled = scaler.transform(X_train)
X_test_scaled = scaler.transform(X_test)

clf = svm.SVC()
clf.fit(X_train_scaled, y_train)

y_pred = clf.predict(X_test_scaled)

accuracy_score(y_test, y_pred)
```

## Most Important Meanings To Remember

```text
X = input features
y = correct labels/answers

X_train = inputs used for learning
y_train = answers used for learning

X_test = inputs used for testing
y_test = hidden answer key used after prediction

clf = classifier/model
fit = train/learn
predict = make predictions
accuracy_score = check how many predictions were correct
scaled = values transformed into a similar range
SVC = Support Vector Classifier
SVM = Support Vector Machine
```
