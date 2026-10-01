# CMT307 Lab 1 Exercise 2-1 Study Notes

Notebook:

`Session 1 Machine learning overview & data preprocessing/Practical 1/CMT307Lab1Ex2-1.ipynb`

Dataset:

`Session 1 Machine learning overview & data preprocessing/Practical 1/online_shoppers_intention.csv`

This notebook is mainly about reading a real dataset and doing basic data understanding / exploratory data analysis.

Unlike Exercise 1, this notebook does not train a machine learning model. It prepares the data and explores it.

The main flow is:

```text
1. Import libraries
2. Read a CSV file
3. Inspect the dataset shape and first rows
4. Check for missing values
5. Split data into input x and output y
6. Explore feature types and summary statistics
7. Look at outliers
8. Plot histograms, boxplots, scatter plots, and bar charts
9. Notice class imbalance
10. Practice the same process on the Abalone dataset
```

## What Is This Dataset About?

The dataset is the Online Shoppers Purchasing Intention dataset.

Each row represents a website visit/session.

The goal is usually to predict whether the visitor generated revenue.

In simple words:

```text
Given information about a user's website visit,
predict whether the visit ended in a purchase.
```

The target column is:

```text
Revenue
```

`Revenue` is originally boolean:

```text
TRUE  = purchase happened
FALSE = purchase did not happen
```

The dataset in this folder has:

```text
12,330 rows
18 columns
```

Revenue counts:

```text
FALSE = 10,422
TRUE  = 1,908
```

So most sessions did not produce revenue.

That means the target is imbalanced.

## Columns In The Dataset

The CSV columns are:

```text
Administrative
Administrative_Duration
Informational
Informational_Duration
ProductRelated
ProductRelated_Duration
BounceRates
ExitRates
PageValues
SpecialDay
Month
OperatingSystems
Browser
Region
TrafficType
VisitorType
Weekend
Revenue
```

Basic meanings:

| Column | Simple meaning |
|---|---|
| `Administrative` | Number of administrative pages visited |
| `Administrative_Duration` | Time spent on administrative pages |
| `Informational` | Number of informational pages visited |
| `Informational_Duration` | Time spent on informational pages |
| `ProductRelated` | Number of product-related pages visited |
| `ProductRelated_Duration` | Time spent on product-related pages |
| `BounceRates` | How often visitors left after viewing only one page |
| `ExitRates` | How often visitors exited from pages |
| `PageValues` | A value related to how useful/valuable pages were before purchase |
| `SpecialDay` | How close the visit was to a special day, such as a holiday |
| `Month` | Month of the visit |
| `OperatingSystems` | Encoded operating system category |
| `Browser` | Encoded browser category |
| `Region` | Encoded region category |
| `TrafficType` | Encoded traffic source category |
| `VisitorType` | Type of visitor, such as returning or new |
| `Weekend` | Whether the visit happened on a weekend |
| `Revenue` | Target/output: whether purchase revenue happened |

## Importing Libraries

```python
import pandas as pd
import numpy as np
```

`pandas` is used for reading and working with table-like data.

`numpy` is used for numerical calculations.

The nickname:

```python
pd
```

means pandas.

The nickname:

```python
np
```

means numpy.

These are standard Python conventions.

## Reading The CSV File

```python
df = pd.read_csv('online_shoppers_intention.csv')
```

This reads the CSV file into a pandas DataFrame.

A DataFrame is like a table:

```text
rows    = examples/records/sessions
columns = variables/features
```

`df` is just a variable name. It is short for DataFrame.

Important beginner point:

The notebook expects `online_shoppers_intention.csv` to be in the current working directory. In this practical, the CSV file is in the same folder as the notebook.

If this line gives a file-not-found error, it usually means the notebook is being run from a different folder.

## Looking At Dataset Shape

```python
df
print('The shape of the dataset is', df.shape)
```

`df` displays the table in the notebook.

`df.shape` gives:

```text
(number_of_rows, number_of_columns)
```

For this dataset:

```text
(12330, 18)
```

That means:

```text
12,330 website sessions
18 columns
```

## Pandas Display Options

```python
pd.set_option('display.max_columns', None, 'display.expand_frame_repr', False)
```

This only changes how pandas displays the table.

It tells pandas:

```text
show all columns
avoid wrapping the table awkwardly
```

It does not change the data.

## First Look At The Data

```python
print(df.head(5))
```

`head(5)` shows the first 5 rows.

This is useful for quickly checking:

- what the columns look like
- whether the data loaded correctly
- whether the values look numeric, text, boolean, etc.

## Checking Missing Values

```python
df.isna().sum()
```

`isna()` checks each cell and returns whether it is missing.

`sum()` counts missing values per column.

So this line answers:

```text
How many missing values does each column have?
```

The notebook says there is no missing data.

That is helpful because missing values often require preprocessing, such as:

- removing rows
- filling missing values with mean/median/mode
- using a special missing-value category

## Splitting Input And Output

The notebook says:

```text
Split the dataset into input x and output y pairs.
```

This is the same idea as Exercise 1.

```text
x = input features
y = output/target
```

Here the target is:

```text
Revenue
```

The model would eventually use the other columns to predict `Revenue`.

## Checking Target Counts

```python
print(df['Revenue'].value_counts())
```

`df['Revenue']` selects the `Revenue` column.

`value_counts()` counts how often each value appears.

Before conversion:

```text
FALSE = no purchase
TRUE  = purchase
```

The counts are:

```text
FALSE = 10,422
TRUE  = 1,908
```

This shows the dataset is imbalanced because there are many more non-purchase examples than purchase examples.

## Converting Boolean To Binary

```python
df['Revenue'] = [1 if  x == True else 0 for x in df['Revenue']]
```

This changes:

```text
TRUE  -> 1
FALSE -> 0
```

After this:

```text
1 = purchase/revenue
0 = no purchase/no revenue
```

This code uses a list comprehension.

Simple interpretation:

```text
For every value in the Revenue column:
    if it is True, replace it with 1
    otherwise, replace it with 0
```

A beginner-friendly equivalent would be:

```python
new_values = []

for value in df['Revenue']:
    if value == True:
        new_values.append(1)
    else:
        new_values.append(0)

df['Revenue'] = new_values
```

## Checking Counts Again

```python
print(df['Revenue'].value_counts())
```

This checks that the conversion worked.

After conversion, the values are:

```text
0 = 10,422
1 = 1,908
```

The counts are the same as before, but the labels changed from `FALSE/TRUE` to `0/1`.

## Creating x And y

```python
x = df.drop('Revenue', 1)
y = df.Revenue
y
```

This separates the dataset.

```python
x
```

contains all input columns except `Revenue`.

```python
y
```

contains only the target/output column, `Revenue`.

So:

```text
x = website session information
y = did the session produce revenue?
```

Important note:

```python
df.drop('Revenue', 1)
```

means drop the `Revenue` column.

The `1` means column axis.

In newer pandas code, you may see this written more clearly as:

```python
df.drop('Revenue', axis=1)
```

or:

```python
df.drop(columns=['Revenue'])
```

The notebook uses the older shorter style.

## Looking At x

```python
print(x.head(5))
```

This shows the first 5 rows of the input features only.

`Revenue` should no longer appear in `x`.

## Data Exploration

```python
df.info()
```

`info()` shows:

- number of rows
- column names
- non-null counts
- data types
- memory usage

Common data types:

```text
int64   = integer numbers
float64 = decimal numbers
object  = usually text/string
bool    = True/False
```

This helps you understand which columns are numeric and which are categorical.

## Numeric Summary With describe()

```python
print(df[['Administrative', 'Informational', 'ProductRelated']].describe())
```

This selects three columns and prints summary statistics.

`describe()` gives values like:

```text
count
mean
std
min
25%
50%
75%
max
```

Simple meanings:

| Statistic | Meaning |
|---|---|
| `count` | Number of non-missing values |
| `mean` | Average |
| `std` | Standard deviation, or spread |
| `min` | Smallest value |
| `25%` | First quartile |
| `50%` | Median |
| `75%` | Third quartile |
| `max` | Largest value |

## Boxplot

```python
df[['Administrative', 'Informational', 'ProductRelated']].boxplot()
```

A boxplot summarizes the distribution of values.

It helps show:

- typical values
- spread
- skew
- possible outliers

The notebook notes that `ProductRelated` is very stretched. This means some visitors viewed many more product-related pages than others.

## Outliers

An outlier is a value that is unusually far away from most other values.

Example:

```text
Most people visit 1-10 product pages,
but one person visits 700 product pages.
```

That 700 might be an outlier.

Outliers are not always wrong. They may be:

- real but unusual behavior
- data entry errors
- bot activity
- measurement/logging problems

## Tukey Outlier Function

```python
def find_outliers_tukey(x):
    q1 = np.percentile(x, 25)
    q3 = np.percentile(x, 75)
    iqr = q3-q1 
    floor = q1 - 1.5*iqr
    ceiling = q3 + 1.5*iqr
    outlier_indices = list(x.index[(x < floor)|(x > ceiling)])
    outlier_values = list(x[outlier_indices])

    return outlier_indices, outlier_values
```

This function finds outliers using the Tukey rule.

Step by step:

```python
q1 = np.percentile(x, 25)
```

Finds the 25th percentile.

```python
q3 = np.percentile(x, 75)
```

Finds the 75th percentile.

```python
iqr = q3 - q1
```

Calculates the interquartile range.

```text
IQR = middle 50% spread of the data
```

```python
floor = q1 - 1.5*iqr
ceiling = q3 + 1.5*iqr
```

Defines the lower and upper limits for normal values.

```python
outlier_indices = list(x.index[(x < floor)|(x > ceiling)])
```

Finds the row indices where the value is below the floor or above the ceiling.

```python
outlier_values = list(x[outlier_indices])
```

Gets the actual outlier values.

```python
return outlier_indices, outlier_values
```

Returns both:

```text
where the outliers are
what the outlier values are
```

## Counting Outliers

```python
outlier_indices, outlier_values = find_outliers_tukey(df['Administrative'])
print(len(np.sort(outlier_values)))
```

This finds and counts outliers in `Administrative`.

The same is done for:

```python
df['Informational']
df['ProductRelated']
```

The notebook says there are many outliers, especially for `Informational`.

Why?

Many `Informational` values are zero. If the upper quartile is zero, then even small non-zero values can be counted as outliers by the Tukey rule.

Important lesson:

```text
An outlier rule can label many values as outliers,
but that does not always mean they should be removed.
```

The notebook chooses not to remove them because removing too many rows can reduce model reliability.

## Full Dataset Boxplot

```python
df.boxplot()
```

This creates a boxplot for numeric columns in the dataset.

The notebook notes that `ProductRelated_Duration` is very large compared with many other columns.

This can make the boxplot hard to read because one feature dominates the scale.

## Duration Columns

```python
print(df[['Administrative_Duration', 'Informational_Duration', 'ProductRelated_Duration']].describe())
df[['Administrative_Duration', 'Informational_Duration', 'ProductRelated_Duration']].boxplot()
```

This focuses on time spent on different page types.

The duration columns measure how long visitors spent on:

```text
Administrative pages
Informational pages
Product-related pages
```

The notebook mentions that some product-related durations are extremely large, up to almost 17 hours.

That could be unusual, but the notebook does not remove those values.

## Histogram Function

```python
import matplotlib.pyplot as plt

def plot_histogram_dv(x,y):
    plt.hist(list(x[y==0]), alpha=0.5, label='Outcome=0', color = 'blue')
    plt.hist(list(x[y==1]), alpha=0.5, label='Outcome=1', color = 'yellow')
    plt.title("Histogram of '{var_name}' by Outcome Category".format(var_name=x.name))
    plt.xlabel("Value")
    plt.ylabel("Frequency")
    plt.legend(loc='upper right')
    plt.show()
```

This function plots two histograms on top of each other:

```text
blue   = sessions where Revenue is 0
yellow = sessions where Revenue is 1
```

This helps compare the distribution of a feature for purchasers vs non-purchasers.

For example:

```python
plot_histogram_dv(df['ExitRates'], y)
```

shows how `ExitRates` differs between sessions with and without revenue.

## What Does x[y==0] Mean?

Inside the function:

```python
x[y==0]
```

means:

```text
select values of feature x only where the target y equals 0
```

And:

```python
x[y==1]
```

means:

```text
select values of feature x only where the target y equals 1
```

So the function compares one feature across the two target classes.

## alpha

```python
alpha=0.5
```

This controls transparency.

`0.5` means the histogram is partially transparent, so overlapping bars are easier to see.

## ExitRates

```python
plot_histogram_dv(df['ExitRates'], y)
df['ExitRates'].describe()
```

Exit rate is related to how often users exit from a page.

The histogram compares exit rates for:

```text
Revenue = 0
Revenue = 1
```

If one class has higher exit rates, it may suggest that leaving pages quickly is related to not buying.

## BounceRates

```python
df['BounceRates'].describe()
plot_histogram_dv(df['BounceRates'], y)
```

Bounce rate is related to one-page visits.

High bounce rate means users often leave after only one page.

This may be important because visitors who leave quickly are less likely to purchase.

## ProductRelated_Duration

```python
df['ProductRelated_Duration'].describe()
plot_histogram_dv(df['ProductRelated_Duration'], y)
```

This explores whether time spent on product pages is related to revenue.

Intuition:

```text
More time on product pages may mean stronger buying interest.
```

But very long durations may also be outliers or unusual sessions.

## Administrative_Duration

```python
plot_histogram_dv(df['Administrative_Duration'], y)
(df['Administrative_Duration']).describe()
```

This explores time spent on administrative pages.

Examples of administrative pages might include account, cart, forms, or similar pages.

## Informational_Duration

```python
plot_histogram_dv(df['Informational_Duration'], y)
df['Informational_Duration'].describe()
```

This explores time spent on informational pages.

Many users may spend zero time here, which can make the distribution very skewed.

## SpecialDay

```python
plot_histogram_dv(df['SpecialDay'], y)
```

`SpecialDay` relates to closeness to a special day or holiday.

The idea is that shopping behavior may change near special days.

## PageValues

```python
plot_histogram_dv(df['PageValues'], y)
df['PageValues'].describe()
```

The notebook observes that as `PageValues` increases, revenue becomes more likely.

Possible interpretation:

```text
Pages with higher value may be closer to successful purchase paths.
```

This may make `PageValues` an important feature for predicting `Revenue`.

## Categorical-Looking Features

The notebook plots histograms for:

```python
plot_histogram_dv(df['TrafficType'], y)
plot_histogram_dv(df['OperatingSystems'], y)
plot_histogram_dv(df['Region'], y)
plot_histogram_dv(df['Browser'], y)
```

These columns contain numbers, but they are really categories.

For example:

```text
Browser 1
Browser 2
Browser 3
```

does not necessarily mean browser 3 is larger or better than browser 1. It is just a code.

Important beginner point:

```text
Some numbers are real quantities.
Some numbers are category labels.
```

Machine learning preprocessing treats these differently.

For real modelling, categorical variables may need encoding, such as one-hot encoding.

## Correlation Heatmap

```python
import seaborn as sns
sns.heatmap(df.corr());
sns.set(font_scale=2)
heatmap = sns.heatmap(df.corr(), vmin=-1, vmax=1, cbar = False)
heatmap.set_title('Correlation Heatmap', fontdict={'fontsize':12}, pad=12);
```

`seaborn` is a plotting library built on top of matplotlib.

`df.corr()` calculates correlations between numeric columns.

Correlation measures how two numeric variables move together.

Values are usually between:

```text
-1 and 1
```

Simple interpretation:

```text
 1  = strong positive relationship
 0  = little/no linear relationship
-1  = strong negative relationship
```

Example:

```text
If BounceRates and ExitRates have high positive correlation,
then sessions/pages with high bounce rates also tend to have high exit rates.
```

Important warning from the notebook:

```text
For categorical variables, correlation may not make much sense.
```

For example, `Browser` might be coded as numbers, but those numbers are categories, not measured quantities.

Also, in newer pandas versions, `df.corr()` may complain if non-numeric columns such as `Month` or `VisitorType` are present. In that case, the modern approach is usually to select numeric columns or use `numeric_only=True`.

## Scatter Plot: BounceRates vs ExitRates

```python
df.plot(kind='scatter', x='BounceRates', y='ExitRates', color = 'blue')
```

This plots each row as one point.

The x-axis is `BounceRates`.

The y-axis is `ExitRates`.

This helps visually check whether the two features are related.

## Scatter Plot: Informational_Duration vs ProductRelated_Duration

```python
df.plot(kind='scatter', x='Informational_Duration', y='ProductRelated_Duration', color = 'blue')
```

This checks whether users who spend more time on informational pages also spend more time on product-related pages.

Scatter plots are useful for spotting:

- relationships
- clusters
- unusual points
- outliers

## Bar Chart: Revenue Imbalance

```python
df['Revenue'].value_counts().plot(kind='bar', title= 'Barplot of Imbalance of Revenue')
```

This plots how many rows are in each target class.

For this dataset:

```text
0 = 10,422
1 = 1,908
```

So the dataset is imbalanced.

This matters because a model could get high accuracy by mostly predicting the majority class.

Example:

```text
If a model always predicts "no purchase",
it would already be correct for many rows.
```

That does not mean the model is useful.

For imbalanced classification, metrics like precision, recall, F1-score, confusion matrix, or ROC-AUC may be more informative than accuracy alone.

## Bar Charts For Other Imbalanced Features

```python
df['Browser'].value_counts().plot(kind='bar', title= 'Barplot of Imbalance of Browser')
df['Weekend'].value_counts().plot(kind='bar', title= 'Barplot of Imbalance of Weekend')
df['OperatingSystems'].value_counts().plot(kind='bar', title= 'Barplot of Imbalance of OperatingSystems')
```

These show whether some categories appear much more often than others.

For example, `Weekend` has:

```text
FALSE = 9,462
TRUE  = 2,868
```

This makes sense because weekends are fewer days than weekdays.

## Data Balancing

The notebook says:

```text
As shown by the barcharts above, the data is pretty imbalanced.
Thus, data balancing method may need to be considered.
```

Data balancing means dealing with unequal class sizes.

Common approaches include:

- undersampling the majority class
- oversampling the minority class
- synthetic oversampling such as SMOTE
- using class weights in the model
- using evaluation metrics suited for imbalance

This notebook does not apply balancing. It only points out that imbalance exists.

## Final Exercise: Abalone Dataset

The last markdown cell says:

```text
You can now practice the above steps by using the Abalone Data Set.
```

This means you should repeat the same process on another dataset:

```text
load data
inspect shape
view first rows
check missing values
split input/output
inspect feature types
summarize numeric columns
plot distributions
look for outliers
check target imbalance
```

## Whole Notebook In One Simple Summary

```text
Read the online shoppers CSV file.
Look at its size and first few rows.
Check that it has no missing values.
Convert Revenue from TRUE/FALSE to 1/0.
Separate input features into x and target labels into y.
Explore data types and summary statistics.
Use boxplots to see spread and possible outliers.
Use the Tukey rule to count outliers.
Use histograms to compare feature distributions for Revenue=0 and Revenue=1.
Use a heatmap and scatter plots to inspect relationships between features.
Use bar charts to notice imbalance in Revenue and other categorical features.
```

## Key Code Flow

```python
import pandas as pd
import numpy as np

df = pd.read_csv('online_shoppers_intention.csv')

print(df.shape)
print(df.head(5))

df.isna().sum()

print(df['Revenue'].value_counts())
df['Revenue'] = [1 if x == True else 0 for x in df['Revenue']]
print(df['Revenue'].value_counts())

x = df.drop('Revenue', 1)
y = df.Revenue

df.info()
df.describe()

df[['Administrative', 'Informational', 'ProductRelated']].boxplot()

outlier_indices, outlier_values = find_outliers_tukey(df['ProductRelated'])

plot_histogram_dv(df['BounceRates'], y)
plot_histogram_dv(df['PageValues'], y)

sns.heatmap(df.corr())

df['Revenue'].value_counts().plot(kind='bar')
```

## Beginner Questions And Answers

### What is a CSV file?

A CSV file is a plain text file that stores table data.

CSV means comma-separated values.

Each row is one record. Each comma separates columns.

### What is `df`?

`df` is a variable name for a pandas DataFrame.

A DataFrame is like a spreadsheet/table in Python.

### Does `x` mean x-axis?

No.

In machine learning, `x` or `X` usually means input features.

`y` means the target/output answer.

Only in a graph does x-axis mean horizontal axis.

### Why is `Revenue` the target?

Because it is the thing we want to predict.

The other columns describe the website visit.

`Revenue` says whether the visit led to a purchase.

### Why convert `Revenue` from TRUE/FALSE to 1/0?

Many machine learning algorithms and metrics work more easily with numeric labels.

So:

```text
TRUE  becomes 1
FALSE becomes 0
```

### What is `value_counts()` for?

It counts how many times each unique value appears.

It is useful for checking class balance and category frequencies.

### What is missing data?

Missing data means some cells do not have a value.

Examples:

```text
NaN
blank cell
null
```

This notebook checks missing data with:

```python
df.isna().sum()
```

### What does `df.info()` tell me?

It tells you the structure of the dataset:

```text
columns
data types
non-missing counts
memory usage
```

### What does `describe()` tell me?

It gives quick numeric summaries:

```text
average
spread
minimum
maximum
quartiles
```

### What is a boxplot?

A boxplot is a compact way to show a distribution.

It shows the middle range of values and possible outliers.

### What is an outlier?

An outlier is an unusually large or small value compared with most data points.

Outliers should be investigated, not automatically deleted.

### What is IQR?

IQR means interquartile range.

It is:

```text
75th percentile - 25th percentile
```

It measures the spread of the middle 50% of the data.

### What is the Tukey rule?

The Tukey rule marks values as outliers if they are below:

```text
Q1 - 1.5 * IQR
```

or above:

```text
Q3 + 1.5 * IQR
```

### Why not remove all outliers?

Because outliers may be real user behavior.

Also, if there are many outliers, removing them may remove too much useful data.

### What is a histogram?

A histogram shows how often values fall into ranges.

It helps you see the distribution of a feature.

### Why plot histograms separately for `Revenue=0` and `Revenue=1`?

To see whether a feature behaves differently for purchase and non-purchase sessions.

If a feature looks very different between the two groups, it may be useful for prediction.

### What is a scatter plot?

A scatter plot shows the relationship between two numeric columns.

Each point is one row/session.

### What is correlation?

Correlation measures how two numeric variables move together.

Positive correlation means they tend to increase together.

Negative correlation means one tends to increase as the other decreases.

### Does correlation prove causation?

No.

Correlation shows association, not proof that one thing causes another.

### Why does correlation not make sense for some categorical variables?

Because category codes are often just labels.

Example:

```text
Browser 1, Browser 2, Browser 3
```

These numbers do not necessarily have mathematical distance or order.

### What is class imbalance?

Class imbalance means one target class appears much more often than another.

Here:

```text
no purchase = many rows
purchase    = fewer rows
```

### Why is class imbalance a problem?

A model may become biased toward predicting the majority class.

It might look accurate while doing poorly on the minority class.

### Is accuracy always enough?

No.

For imbalanced datasets, accuracy can be misleading.

Other useful metrics include:

```text
precision
recall
F1-score
confusion matrix
ROC-AUC
```

### Did this notebook train a model?

No.

This notebook focuses on data loading and data exploration.

It prepares you for modelling later.

### What preprocessing might still be needed before modelling?

Possible next steps include:

```text
encoding categorical columns like Month and VisitorType
scaling numeric features
splitting into train/test sets
handling class imbalance
choosing evaluation metrics
training a classifier
```

### What is the biggest lesson of this notebook?

Before training a model, you need to understand the data.

You should know:

```text
What are the rows?
What are the columns?
What is the target?
Are there missing values?
Are there outliers?
Are the classes imbalanced?
Which features look related to the target?
Which columns are numeric and which are categorical?
```

## Most Important Meanings To Remember

```text
df = pandas DataFrame/table
row = one website session
column = one variable/feature
x = input features
y = target/output
Revenue = target column
0 = no purchase
1 = purchase
value_counts = count each unique value
isna = check missing values
describe = numeric summary
info = dataset structure and data types
boxplot = distribution and possible outliers
IQR = middle 50% spread
histogram = frequency distribution
scatter plot = relationship between two variables
correlation = numeric association between variables
class imbalance = unequal target class counts
EDA = exploratory data analysis
```
