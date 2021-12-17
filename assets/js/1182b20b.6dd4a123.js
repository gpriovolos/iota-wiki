"use strict";(self.webpackChunkiota_wiki=self.webpackChunkiota_wiki||[]).push([[40100],{59380:function(e,n,t){t.r(n),t.d(n,{contentTitle:function(){return u},default:function(){return h},frontMatter:function(){return c},metadata:function(){return p},toc:function(){return m}});var i=t(83117),r=t(80102),o=(t(67294),t(3905)),a=t(66816),l=t(71871),s=t(34369),d=["components"],c={title:"Merkle Key Collection",sidebar_label:"Merkle Key Collection",description:"Explain why, how to use and how merkle key collections work",image:"/img/Identity_icon.png",keywords:["Merkle Key Collections","DID"]},u=void 0,p={unversionedId:"verifiable_credentials/merkle_key_collection",id:"verifiable_credentials/merkle_key_collection",title:"Merkle Key Collection",description:"Explain why, how to use and how merkle key collections work",source:"@site/external/identity.rs/documentation/docs/verifiable_credentials/merkle_key_collection.mdx",sourceDirName:"verifiable_credentials",slug:"/verifiable_credentials/merkle_key_collection",permalink:"/identity.rs/verifiable_credentials/merkle_key_collection",editUrl:"https://github.com/iotaledger/identity.rs/edit/dev/external/identity.rs/documentation/docs/verifiable_credentials/merkle_key_collection.mdx",tags:[],version:"current",frontMatter:{title:"Merkle Key Collection",sidebar_label:"Merkle Key Collection",description:"Explain why, how to use and how merkle key collections work",image:"/img/Identity_icon.png",keywords:["Merkle Key Collections","DID"]},sidebar:"docs",previous:{title:"Revocation",permalink:"/identity.rs/verifiable_credentials/revoke"},next:{title:"Verifiable Presentations",permalink:"/identity.rs/verifiable_credentials/verifiable_presentations"}},m=[{value:"Example",id:"example",children:[],level:2}],f={toc:m};function h(e){var n=e.components,t=(0,r.Z)(e,d);return(0,o.kt)("wrapper",(0,i.Z)({},f,t,{components:n,mdxType:"MDXLayout"}),(0,o.kt)("p",null,"TODO: Explain why, how to use and how merkle key collections work."),(0,o.kt)("h2",{id:"example"},"Example"),(0,o.kt)("p",null,"This example shows how you can sign/revoke verifiable credentials on scale.\nInstead of ",(0,o.kt)("a",{parentName:"p",href:"revoke"},"revoking the entire verification method"),", you can revoke a single key from a MerkleKeyCollection.\nYou can create this MerkleKeyCollection as a collection of a power of 2 amount of keys.\nThe issuer should use every key once to sign a verifiable credential."),(0,o.kt)(a.Z,{groupId:"programming-languages",defaultValue:"rust",values:[{label:"Rust",value:"rust"},{label:"Node.js",value:"nodejs"}],mdxType:"Tabs"},(0,o.kt)(l.Z,{value:"rust",mdxType:"TabItem"},(0,o.kt)(s.Z,{className:"language-rust",mdxType:"CodeBlock"},'// Copyright 2020-2021 IOTA Stiftung\n// SPDX-License-Identifier: Apache-2.0\n\n//! An example that revokes a key and shows how verification fails as a consequence.\n//!\n//! cargo run --example merkle_key\n\nuse rand::rngs::OsRng;\nuse rand::Rng;\n\nuse identity::core::Timestamp;\nuse identity::core::ToJson;\nuse identity::credential::Credential;\nuse identity::crypto::merkle_key::Sha256;\nuse identity::crypto::merkle_tree::Proof;\nuse identity::crypto::KeyCollection;\nuse identity::crypto::PrivateKey;\nuse identity::crypto::PublicKey;\nuse identity::did::verifiable::VerifierOptions;\nuse identity::did::MethodScope;\nuse identity::iota::ClientMap;\nuse identity::iota::CredentialValidation;\nuse identity::iota::CredentialValidator;\nuse identity::iota::IotaDID;\nuse identity::iota::IotaVerificationMethod;\nuse identity::iota::Receipt;\nuse identity::prelude::*;\n\nmod common;\nmod create_did;\n\n#[tokio::main]\nasync fn main() -> Result<()> {\n  // Create a client instance to send messages to the Tangle.\n  let client: ClientMap = ClientMap::new();\n\n  // Create a signed DID Document/KeyPair for the credential issuer (see create_did.rs).\n  let (mut issuer_doc, issuer_key, issuer_receipt): (IotaDocument, KeyPair, Receipt) = create_did::run().await?;\n\n  // Create a signed DID Document/KeyPair for the credential subject (see create_did.rs).\n  let (subject_doc, _, _): (IotaDocument, KeyPair, Receipt) = create_did::run().await?;\n\n  // Generate a Merkle Key Collection Verification Method with 8 keys (Must be a power of 2)\n  let keys: KeyCollection = KeyCollection::new_ed25519(8)?;\n  let method_did: IotaDID = issuer_doc.id().clone();\n  let method = IotaVerificationMethod::create_merkle_key::<Sha256>(method_did, &keys, "merkle-key")?;\n\n  // Add to the DID Document as a general-purpose verification method\n  issuer_doc.insert_method(method, MethodScope::VerificationMethod)?;\n  issuer_doc.metadata.previous_message_id = *issuer_receipt.message_id();\n  issuer_doc.metadata.updated = Timestamp::now_utc();\n  issuer_doc.sign_self(issuer_key.private(), &issuer_doc.default_signing_method()?.id())?;\n\n  // Publish the Identity to the IOTA Network and log the results.\n  // This may take a few seconds to complete proof-of-work.\n  let receipt: Receipt = client.publish_document(&issuer_doc).await?;\n  println!("Publish Receipt > {:#?}", receipt);\n\n  // Create an unsigned Credential with claims about `subject` specified by `issuer`.\n  let mut credential: Credential = common::issue_degree(&issuer_doc, &subject_doc)?;\n\n  // Select a random key from the collection\n  let index: usize = OsRng.gen_range(0..keys.len());\n\n  let public: &PublicKey = keys.public(index).unwrap();\n  let private: &PrivateKey = keys.private(index).unwrap();\n\n  // Generate an inclusion proof for the selected key\n  let proof: Proof<Sha256> = keys.merkle_proof(index).unwrap();\n\n  // Sign the Credential with the issuers private key\n  issuer_doc\n    .signer(private)\n    .method("merkle-key")\n    .merkle_key((public, &proof))\n    .sign(&mut credential)?;\n\n  println!("Credential JSON > {:#}", credential);\n\n  let credential_json: String = credential.to_json()?;\n\n  // Check the verifiable credential is valid\n  let validator: CredentialValidator<ClientMap> = CredentialValidator::new(&client);\n  let validation: CredentialValidation = validator\n    .check_credential(&credential_json, VerifierOptions::default())\n    .await?;\n  assert!(validation.verified);\n\n  println!("Credential Validation > {:#?}", validation);\n\n  // The Issuer would like to revoke the credential (and therefore revokes key at `index`)\n  issuer_doc\n    .try_resolve_method_mut("merkle-key")\n    .and_then(IotaVerificationMethod::try_from_mut)?\n    .revoke_merkle_key(index)?;\n  issuer_doc.metadata.previous_message_id = *receipt.message_id();\n  issuer_doc.metadata.updated = Timestamp::now_utc();\n  issuer_doc.sign_self(issuer_key.private(), &issuer_doc.default_signing_method()?.id())?;\n\n  let receipt: Receipt = client.publish_document(&issuer_doc).await?;\n\n  println!("Publish Receipt > {:#?}", receipt);\n\n  // Check the verifiable credential is revoked\n  let validation: CredentialValidation = validator\n    .check_credential(&credential_json, VerifierOptions::default())\n    .await?;\n  assert!(!validation.verified);\n\n  println!("Credential Validation > {:#?}", validation);\n\n  Ok(())\n}\n')),(0,o.kt)(l.Z,{value:"nodejs",mdxType:"TabItem"},(0,o.kt)(s.Z,{className:"language-javascript",mdxType:"CodeBlock"},'// Copyright 2020-2021 IOTA Stiftung\n// SPDX-License-Identifier: Apache-2.0\n\nimport {\n    Client,\n    Config,\n    Credential,\n    Digest,\n    KeyCollection,\n    KeyType,\n    MethodScope,\n    SignatureOptions,\n    Timestamp,\n    VerificationMethod,\n    VerifierOptions\n} from \'@iota/identity-wasm\';\nimport {createIdentity} from \'./create_did\';\nimport {logExplorerUrl} from \'./utils\';\n\n/**\n This example shows how to sign/revoke verifiable credentials on scale.\n Instead of revoking the entire verification method, a single key can be revoked from a MerkleKeyCollection.\n This MerkleKeyCollection can be created as a collection of a power of 2 amount of keys.\n Every key should be used once by the issuer for signing a verifiable credential.\n When the verifiable credential must be revoked, the issuer revokes the index of the revoked key.\n\n @param {{network: Network, explorer: ExplorerUrl}} clientConfig\n **/\nasync function merkleKey(clientConfig) {\n    // Create a default client configuration from the parent config network.\n    const config = Config.fromNetwork(clientConfig.network);\n\n    // Create a client instance to publish messages to the Tangle.\n    const client = Client.fromConfig(config);\n\n    // Creates new identities (See "create_did" example)\n    const alice = await createIdentity(clientConfig);\n    const issuer = await createIdentity(clientConfig);\n\n    // Add a Merkle Key Collection Verification Method with 8 keys (Must be a power of 2)\n    const keys = new KeyCollection(KeyType.Ed25519, 8);\n    const method = VerificationMethod.createMerkleKey(Digest.Sha256, issuer.doc.id, keys, "key-collection")\n\n    // Add to the DID Document as a general-purpose verification method\n    issuer.doc.insertMethod(method, MethodScope.VerificationMethod());\n    issuer.doc.metadataPreviousMessageId = issuer.receipt.messageId;\n    issuer.doc.metadataUpdated = Timestamp.nowUTC();\n    issuer.doc.signSelf(issuer.key, issuer.doc.defaultSigningMethod().id.toString());\n\n    // Publish the Identity to the IOTA Network and log the results.\n    // This may take a few seconds to complete proof-of-work.\n    const receipt = await client.publishDocument(issuer.doc);\n    logExplorerUrl("Identity Update:", clientConfig.explorer, receipt.messageId);\n\n    // Prepare a credential subject indicating the degree earned by Alice\n    let credentialSubject = {\n        id: alice.doc.id.toString(),\n        name: "Alice",\n        degreeName: "Bachelor of Science and Arts",\n        degreeType: "BachelorDegree",\n        GPA: "4.0"\n    };\n\n    // Create an unsigned `UniversityDegree` credential for Alice\n    const unsignedVc = Credential.extend({\n        id: "https://example.edu/credentials/3732",\n        type: "UniversityDegreeCredential",\n        issuer: issuer.doc.id.toString(),\n        credentialSubject,\n    });\n\n    // Sign the credential with Issuer\'s Merkle Key Collection method, with key index 0\n    const signedVc = issuer.doc.signCredential(unsignedVc, {\n        method: method.id.toString(),\n        public: keys.public(0),\n        private: keys.private(0),\n        proof: keys.merkleProof(Digest.Sha256, 0)\n    }, SignatureOptions.default());\n\n    // Check the verifiable credential is valid\n    const result = await client.checkCredential(signedVc.toString(), VerifierOptions.default());\n    console.log(`VC verification result: ${result.verified}`);\n    if (!result.verified) throw new Error("VC not valid");\n\n    // The Issuer would like to revoke the credential (and therefore revokes key 0)\n    issuer.doc.revokeMerkleKey(method.id.toString(), 0);\n    issuer.doc.metadataPreviousMessageId = receipt.messageId;\n    issuer.doc.metadataUpdated = Timestamp.nowUTC();\n    issuer.doc.signSelf(issuer.key, issuer.doc.defaultSigningMethod().id.toString());\n    const nextReceipt = await client.publishDocument(issuer.doc);\n    logExplorerUrl("Identity Update:", clientConfig.explorer, nextReceipt.messageId);\n\n    // Check the verifiable credential is revoked\n    const newResult = await client.checkCredential(signedVc.toString(), VerifierOptions.default());\n    console.log(`VC verification result (false = revoked): ${newResult.verified}`);\n    if (newResult.verified) throw new Error("VC not revoked");\n}\n\nexport {merkleKey};\n'))))}h.isMDXComponent=!0},71871:function(e,n,t){var i=t(67294);n.Z=function(e){var n=e.children,t=e.hidden,r=e.className;return i.createElement("div",{role:"tabpanel",hidden:t,className:r},n)}},66816:function(e,n,t){t.d(n,{Z:function(){return p}});var i=t(83117),r=t(67294),o=t(5730),a=t(54179);var l=function(){var e=(0,r.useContext)(a.Z);if(null==e)throw new Error('"useUserPreferencesContext" is used outside of "Layout" component.');return e},s=t(59137),d=t(86010),c="tabItem_1uMI";function u(e){var n,t,i,o=e.lazy,a=e.block,u=e.defaultValue,p=e.values,m=e.groupId,f=e.className,h=r.Children.map(e.children,(function(e){if((0,r.isValidElement)(e)&&void 0!==e.props.value)return e;throw new Error("Docusaurus error: Bad <Tabs> child <"+("string"==typeof e.type?e.type:e.type.name)+'>: all children of the <Tabs> component should be <TabItem>, and every <TabItem> should have a unique "value" prop.')})),k=null!=p?p:h.map((function(e){var n=e.props;return{value:n.value,label:n.label}})),y=(0,s.lx)(k,(function(e,n){return e.value===n.value}));if(y.length>0)throw new Error('Docusaurus error: Duplicate values "'+y.map((function(e){return e.value})).join(", ")+'" found in <Tabs>. Every value needs to be unique.');var v=null===u?u:null!=(n=null!=u?u:null==(t=h.find((function(e){return e.props.default})))?void 0:t.props.value)?n:null==(i=h[0])?void 0:i.props.value;if(null!==v&&!k.some((function(e){return e.value===v})))throw new Error('Docusaurus error: The <Tabs> has a defaultValue "'+v+'" but none of its children has the corresponding value. Available values are: '+k.map((function(e){return e.value})).join(", ")+". If you intend to show no default tab, use defaultValue={null} instead.");var g=l(),_=g.tabGroupChoices,b=g.setTabGroupChoices,w=(0,r.useState)(v),C=w[0],x=w[1],I=[],T=(0,s.o5)().blockElementScrollPositionUntilNextRender;if(null!=m){var M=_[m];null!=M&&M!==C&&k.some((function(e){return e.value===M}))&&x(M)}var D=function(e){var n=e.currentTarget,t=I.indexOf(n),i=k[t].value;i!==C&&(T(n),x(i),null!=m&&b(m,i))},S=function(e){var n,t=null;switch(e.key){case"ArrowRight":var i=I.indexOf(e.currentTarget)+1;t=I[i]||I[0];break;case"ArrowLeft":var r=I.indexOf(e.currentTarget)-1;t=I[r]||I[I.length-1]}null==(n=t)||n.focus()};return r.createElement("div",{className:"tabs-container"},r.createElement("ul",{role:"tablist","aria-orientation":"horizontal",className:(0,d.Z)("tabs",{"tabs--block":a},f)},k.map((function(e){var n=e.value,t=e.label;return r.createElement("li",{role:"tab",tabIndex:C===n?0:-1,"aria-selected":C===n,className:(0,d.Z)("tabs__item",c,{"tabs__item--active":C===n}),key:n,ref:function(e){return I.push(e)},onKeyDown:S,onFocus:D,onClick:D},null!=t?t:n)}))),o?(0,r.cloneElement)(h.filter((function(e){return e.props.value===C}))[0],{className:"margin-vert--md"}):r.createElement("div",{className:"margin-vert--md"},h.map((function(e,n){return(0,r.cloneElement)(e,{key:n,hidden:e.props.value!==C})}))))}function p(e){var n=(0,o.Z)();return r.createElement(u,(0,i.Z)({key:String(n)},e))}}}]);