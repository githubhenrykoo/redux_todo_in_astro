---
created: 2024-04-11T23:14:52+08:00
modified: 2024-10-15T10:02:19+08:00
title: Dirichlet distribution, Bayesian statistics
subject: Dirichlet distribution, Meme, Paradigm Shift, Unexpected Signal, Bayesian statistics, Simplex, Simplices
authors: ChatGPT
---

The Dirichlet distribution is a family of continuous multivariate probability distributions parameterized by a vector of positive reals. It is the multivariate generalization of the beta distribution and is commonly used in Bayesian statistics, particularly in the context of defining priors for the proportions of categories in multinomial distributions. The Dirichlet distribution is essential in various applications, including topic modeling with [[Latent Dirichlet Allocation]] (LDA), where it helps model the distribution of topics in documents and the distribution of words in topics.
The original paper can be found here: [[Annotated PDF of Latent Dirichlet Allocation]]
### Mathematical Expression

Given a vector of parameters $α=(α_1​,α_2​,...,α_K​$) where each $α_k​>0$, the [[Dirichlet distribution]], denoted as **$\mathbb{Dir}(α)$**, is defined over a **$K$-dimensional simplex** (a $K$-dimensional vector $x$ where each $x_k​≥0$ and $∑_{k=1} ^{K} ​x_k​=1$. The probability density function (PDF) of the [[Dirichlet distribution]] for $x$ given $α$ is:

$
f(\mathbf{x}; \boldsymbol{\alpha}) = \frac{1}{\text{B}(\boldsymbol{\alpha})} \prod_{k=1}^{K} x_k^{\alpha_k - 1}
$​

where $B(α)$ is the normalization constant to ensure the distribution integrates to one over the simplex and is defined as:

$
\text{B}(\boldsymbol{\alpha}) = \frac{\prod_{k=1}^{K} \Gamma(\alpha_k)}{\Gamma\left(\sum_{k=1}^{K} \alpha_k\right)} 
$

In this expression, $\Gamma$ represents the gamma function, which generalizes the factorial function to real and complex numbers, with $\Gamma(n)=(n−1)!$ for any positive integer $n$.

### Interpretation

- **Parameters $α$:** The parameters $α_k$​ of the Dirichlet distribution influence the shape of the distribution. Larger $α_k$​ values bias the distribution towards higher probabilities for the $k$-th component of $x$, indicating a stronger presence or preference for that category.
    
- **Symmetry:** When all $α_k$​ are equal, the [[Dirichlet distribution]] is **symmetric across all dimensions**. As the values of $α_k$​ diverge, the distribution becomes increasingly skewed towards the dimensions with higher $α_k$​ values.
    

The Dirichlet distribution's flexibility in modeling the probabilities of categorical outcomes makes it a powerful tool in [[Bayesian inference]], particularly in applications requiring the estimation of proportions or mixture components.

# References
```dataview 
Table title as Title, authors as Authors
where contains(subject, "Dirichlet distribution") or contains(subject, "Dirichlet")
sort modified desc, authors, title
```