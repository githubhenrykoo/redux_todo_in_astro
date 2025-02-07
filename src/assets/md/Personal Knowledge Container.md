---
aliases:
  - PKC
  - Personal Knowledge Container
  - Project Knowledge Container
  - Public Knowledge Container
  - 個人知識容器
software: PKM Software
website: https://pkc.pub
github_repo: https://github.com/xlp0/PKC
tags:
  - XLP
  - SoG
subject: IAM,Authelia,Authentication, Homelab, Container, PKC, SBT, Soulbound Token, Personal Knowledge Container, DKR, UTP, KMS, Knowledge Management System
title: A Knowledge Container for Personal, Project, and Public use
authors: Ben Koo
modified: 2024-12-17T10:42:49+08:00
---

#XLP #NSM #SoG  #NAS #content_addressable 

[[Progressive Knowledge Container]], originally called: [[Personal Knowledge Container|Personal]], [[Public Knowledge Container]] or just [[PKC]] in short, is a technologically supported [[System of Record]] for managing personal knowledge. PKC establishes operational legitimacy by ensuring the reliability of tracked knowledge records, thus enabling individuals and organizations to maintain their networked existence with minimal barriers to entry for knowledge management.

At its core, PKC operates on the principle of [[Unity]], abstracting a unified framework to manage knowledge across personal, project, and public domains. This unity introduces a form of **compactness**, simplifying the complex layers of knowledge into a coherent, scalable structure. By ensuring **symmetry** across different contexts—whether personal or shared—PKC allows knowledge to be reused and applied consistently, creating **universality** in its application.

Using a complete stack solution inspired by cloud technologies, PKC leverages functionally modularized software and hardware like [[Docker]] containers, [[Decentralized Web Nodes]], and [[Peer-to-Peer]] networking protocols to provide a scalable, high-availability infrastructure. This unified approach enables predictable and accountable knowledge management, reflecting the interconnected nature of knowledge systems across diverse environments.

This approach allows for convenient and rapid deployment of knowledge, even in regions and societies with limited existing infrastructure. By facilitating effective learning and knowledge acquisition, PKC reduces time to recovery in the event of disasters or infrastructure failures, thereby ensuring the preservation and accessibility of valuable knowledge assets.

See [[Logic Model for PKC]].

![[Logic Model for PKC#The Logic Model]]

# Knowledge Asset Management in the era of GAI

[[PKC]]'s core mission is to refine and optimize [[knowledge management]] by leveraging locally available data in a [[Timeliness|timely manner]], thereby improving knowledge utilization and reducing biases commonly found in global data sources such as search engines and publicly-facing Large Language Models. However, simply managing data does not fully address the complexities of knowledge management, as the value of knowledge is heavily influenced by context. To determine its true value, decisions or computations must be based on semantically relevant judgments. This nuanced approach to knowledge evaluation necessitates a wide range of semantic computation capabilities, which have only recently become widely available thanks to advances in generative AI technology. The implementation of a [[Unified Configuration Management]] ([[UCM]]) strategy is critical in organizing data assets and computational resources in a way that supports these complex decisions. The proliferation of generative AI, which allows for more effective and context-sensitive knowledge management, has contributed significantly to the shift toward a **unified** approach in [[configuration management]]. See [[Why Unified Configuration Management Matters]].

## UCM regulates PKC Development

PKC actively practices the principle of [[Unified Configuration Management]] to fully harness the potential of data and computing resource management in the [[Generative AI]] era. This deliberate approach underscores PKC's dedication to creating a seamless, efficient, and secure framework for data management, aligning with the advanced requirements of contemporary AI-driven environments.

1. **Centralized Governance:** PKC recognizes the complexity and diversity of data management needs across various domains and scales. A Unified Configuration Management system serves as a centralized mechanism to govern configurations, ensuring consistency, security, and coherence across all instances of PKC. This centralized governance model simplifies the management of data assets, making it easier for users to maintain the integrity and sovereignty of their data.
    
2. **Enhanced Security and Compliance:** By implementing a Unified Configuration Management framework, PKC strengthens its security-first moto. This framework ensures that all PKC instances adhere to the highest security standards, safeguarding data sovereignty and enhancing the overall security posture. It also facilitates compliance with regulatory requirements by providing a standardized method for configuring and managing security policies.
    
3. **Operational Efficiency:** The approach streamlines operations by enabling the efficient deployment and management of PKC instances across different environments. It reduces the complexity involved in configuring and updating PKC, thereby lowering operational costs and improving system reliability.
    
4. **Sustainable Scalability:** As PKC aims to be scale-free, the [[Unified Configuration Management]] approach ensures that scalability does not compromise the system's integrity or performance. It allows for seamless expansion or reduction based on the community's size or the individual's needs, without sacrificing the local-first principle or security commitments.
    
5. **Interoperability and Flexibility:** This approach fosters interoperability between different PKC instances and external systems. It enables a flexible and adaptable infrastructure that can evolve with technological advancements and user requirements. By maintaining a unified configuration standard, PKC ensures that its platform remains at the forefront of technological innovation, catering to a broad spectrum of knowledge domains and user needs.
    

In essence, PKC's adoption of a [[Unified Configuration Management]] approach is grounded in the requirements of making knowledge management [[Upgradability|upgradable]]. It aims to provide a robust, secure, and user-friendly platform that not only respects the data sovereignty of individuals and small organizations but also sets a new standard in data management and collaboration.

# Design Principles of PKC
The following points illustrates the design principles of PKC.

## Local-first Principle of PKC
[[PKC]]'s goal is to increase the logical integrity of the data owner's personal understanding of their surroundings while simultaneously striving to condense their own data in ways that can be densely packed and reused as broadly as possible. The rationale of this design is to protect and harvest the value of locally available data because the value of data is defined by its structural integrity and density. 

## The security-first moto of PKC
The generic functionality of a physical [[PKC]] is similar to the functionality of a [[Network Attached Storage]]([[Network Attached Storage|NAS]]), or a [[Decentralized Web Node]]([[DWN]]). However, [[PKC]] has a unique requirement in adopting an [[End-to-End Security Model]] that intends to protect the data sovereignty of individuals or small organizations. See [[Homelab]] by [[Jim Watson]].

## Scale-free 
It is a tool designed to be operated by individuals or communities of varying sizes and can be deployed to network environments of your choice primarily using Docker-based container technologies. After the initial installation of "PKC", your local PKC instance will work, even without access to the Internet or any external network. However, it also allows for interactions between any network as long as the owners of the [[PKC]]s desire to do so. 

## Independent of Knowledge Domains
PKC allows for an integrative deployment of user-friendly knowledge presentation, extensible functionalities, and self-servicing data asset ownership in a single package. It is based on the principle of [[Content Addressable Scheme]] to manage data assets. It is completely independent of any knowledge domain. As long as it is recordable as digital data, [[PKC]] will work. In other words, this technology platform is designed to lower the entry barrier for the ownership of self-sovereign data assets.



# Functional Requirements
[[PKC]] must fulfill the following requirements:
1. Provide the means to enable [[Personalized Data Sovereignty]] in terms of enabling data collectors and owners to share selected data content without the intrusion of privacy and breach of ownership boundaries.
2. Adopt scalable [[Identity|identity provision]] technologies, such as [[DID]] and [[Open Source GIS]] APIs to associate data content correctness with the data provider's using [[Physical Meaning of Data]] and [[Social Meaning of Data|Social Meaning of Data]].
3. Enable personalized data refinement, storage, retrieval, presentation, backup, and transaction with adequate data security measures.
4. Adopt and adapt to existing data formats and media presentation capabilities using Open Source tools and Open Source data content
5. Provide systematic usage instructions and continuous content knowledge refinement process using open source tools such as [[AI]]/[[LLM|Large Language Models]], and [[CICD]].
6. Adopt a [[Reproducible]] data storage and manipulation platform using Open Source platforms, such as [[NixOS]], [[Docker]], and [[Kubernetes]].
7. Provide a highly available [[System of Record]] ([[SoR]]) to guarantee the integrity and accessibility of data assets under all circumstances, ensuring data sovereignty for individuals and organizations regardless of their economic status or resource availability.
### Usage Scenarios of PKC
[[PKC]] as a software platform is designed to be [[Scale-free]] and therefore can be applied to Personal, Project, and Public uses. This means that individuals, communities, and organizations of varying sizes. The initial use cases can be combined with [[personal knowledge management|PKM]], and organizational [[Data Asset Management|data asset]]/content management.

## Other Related Technologies and Methodologies with [[PKC]]


Once installed, PKC can function even without internet access. It offers user-friendly knowledge presentation, extensible functionalities, and self-servicing data asset ownership in a single package. The goal of PKC is to make it easier for individuals to own their self-sovereign data assets by reducing the barriers to entry. A popular implementation is [[Network Attached Storage]] ([[Network Attached Storage|NAS]]), which basically has most of the functionality of [[PKC]].

PKC was developed in context with [[XLP]] and the [[Science of Governance|SoG]]. A way to organize content knowledge can be considered to be an [[Intentional Workflow]], which can be implemented using [[Zettlekasten Workflow]]. It is also an embodiment of a [[Conscious Agency]]. Initially, it also must have many plug-ins for existing [[Personal Knowledge Management|PKM]] tools to extract data for inputs and metrics of individual users and agencies.  It needs to use [[Permanent/Projects/PKC Kernel/Blockchain]], [[Smart Contract|Smart Contracts]], [[Git]], and [[IPFS]] to realize its reach.

## An architectural diagram for PKC


A matrix-based approach to visualize the overall architecture of [[PKC]] is shown as follows:

![[SoG_with_SDN.png]]
[Go to the interactive Canvas](SoG_with_SDN.canvas)

## The Architecture Diagram of PKC

![[PKC_Architecture.excalidraw|800]]
[Go to Excalidraw](PKC_Architecture.excalidraw)

This diagram represents the different components and functionalities of PKC, including data sovereignty, identity provision, data management, adaptation, usage instructions, and reproducibility. Each component is represented as a subgraph with its corresponding elements.


## Process Diagram for PKC

Certainly! Here is a process diagram using Mermaid syntax that illustrates how PKC processes data:

![[PKC_workflow.excalidraw|800]]
[Go to Excalidraw version of this diagram](PKC_workflow.excalidraw)

This process diagram outlines the sequential steps involved in the data processing within PKC. It starts with data collection, followed by data validation and cleaning. The processed data is then stored, encrypted, and backed up. When needed, the data is retrieved, decrypted, and managed through organization, indexing, version control, and metadata application. The processed and managed data is presented through visualization, report generation, and data sharing. Finally, data transactions are facilitated through access control, data sharing, and collaboration.

## References

```dataview
Table title as Title, authors as Authors
where contains(subject, "PKC") or  contains(subject, "UTP")
```
