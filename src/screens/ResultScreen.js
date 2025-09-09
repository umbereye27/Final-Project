"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from "react-native"
import Icon from "react-native-vector-icons/Ionicons"
import { useTheme } from "../theme/ThemeContext"

const ResultScreen = ({ route, navigation }) => {
    const { prediction, confidence, imageUri, isSaved, saveMessage } = route.params || {}
    const { theme } = useTheme()
    const [fadeAnim] = useState(new Animated.Value(0))
    const [scaleAnim] = useState(new Animated.Value(0.9))
    const [recommendationAnim] = useState(new Animated.Value(0))
    const [showRecommendations, setShowRecommendations] = useState(false)
    const [typingText, setTypingText] = useState("")

    // Comprehensive recommendations database
    const recommendationsDatabase = {
        Chickenpox: {
            condition: "Chickenpox (Varicella)",
            severity: "Medium",
            description:
                "A highly contagious viral infection causing an itchy, blister-like rash. Most common in children but can affect adults.",
            immediateActions: [
                "Isolate yourself/child for 5-7 days until all blisters have crusted over",
                "Apply calamine lotion to reduce itching and discomfort",
                "Take lukewarm baths with colloidal oatmeal or baking soda",
                "Keep fingernails short to prevent scratching and secondary infection",
            ],
            medications: [
                "Acetaminophen or ibuprofen for fever and pain relief",
                "Antihistamines (like Benadryl) for severe itching",
                "Antiviral medication (acyclovir) if started within 24 hours of rash onset",
            ],
            whenToSeekHelp: [
                "High fever (over 102°F/39°C) that persists",
                "Signs of bacterial infection (pus, increased redness, warmth)",
                "Difficulty breathing or chest pain",
                "Severe headache or neck stiffness",
                "If you're pregnant, immunocompromised, or over 65",
            ],
            prevention: [
                "Vaccination is the best prevention (varicella vaccine)",
                "Avoid contact with infected individuals",
                "Practice good hand hygiene",
            ],
            urgencyLevel: "medium",
            estimatedRecovery: "7-10 days",
            contagiousPeriod: "1-2 days before rash appears until all blisters crust over",
        },
        Cowpox: {
            condition: "Cowpox",
            severity: "Low",
            description:
                "A rare viral skin infection typically contracted from infected animals, particularly cats and cows.",
            immediateActions: [
                "Clean the affected area gently with soap and water",
                "Cover lesions with sterile bandages to prevent spread",
                "Avoid touching or scratching the lesions",
                "Wash hands thoroughly after any contact with affected areas",
            ],
            medications: [
                "Over-the-counter pain relievers for discomfort",
                "Topical antiseptic to prevent secondary bacterial infection",
                "No specific antiviral treatment needed in most cases",
            ],
            whenToSeekHelp: [
                "Lesions become increasingly painful or show signs of infection",
                "Development of fever or flu-like symptoms",
                "If you have a compromised immune system",
                "Lesions don't begin healing after 2-3 weeks",
            ],
            prevention: [
                "Avoid contact with infected animals",
                "Wear gloves when handling animals with skin lesions",
                "Practice good hygiene after animal contact",
            ],
            urgencyLevel: "low",
            estimatedRecovery: "6-12 weeks",
            contagiousPeriod: "Low human-to-human transmission risk",
        },
        Healthy: {
            condition: "Healthy Skin",
            severity: "None",
            description: "Your skin appears healthy with no signs of concerning lesions or infections.",
            immediateActions: [
                "Continue your current skincare routine",
                "Maintain good hygiene practices",
                "Monitor your skin regularly for any changes",
                "Protect your skin from excessive sun exposure",
            ],
            medications: [
                "No medications needed",
                "Continue any prescribed skincare products",
                "Use sunscreen daily (SPF 30 or higher)",
            ],
            whenToSeekHelp: [
                "Any new or changing moles or lesions",
                "Persistent skin irritation or rashes",
                "Annual skin check-ups if you have risk factors",
                "Any concerning skin changes",
            ],
            prevention: [
                "Regular self-examination of skin",
                "Sun protection and avoiding tanning beds",
                "Healthy diet and adequate hydration",
                "Professional skin screenings as recommended",
            ],
            urgencyLevel: "none",
            estimatedRecovery: "N/A - Maintain current health",
            contagiousPeriod: "Not applicable",
        },
        HFMD: {
            condition: "Hand, Foot, and Mouth Disease",
            severity: "Medium",
            description:
                "A common viral infection causing sores in the mouth and rashes on hands and feet, primarily affecting children.",
            immediateActions: [
                "Stay hydrated with cool liquids (avoid acidic drinks)",
                "Eat soft, bland foods to minimize mouth pain",
                "Rinse mouth with warm salt water for older children/adults",
                "Isolate until fever-free for 24 hours",
            ],
            medications: [
                "Acetaminophen or ibuprofen for fever and pain",
                "Topical oral pain relievers for mouth sores",
                "No antibiotics needed (viral infection)",
            ],
            whenToSeekHelp: [
                "Signs of dehydration (decreased urination, dry mouth)",
                "High fever persisting more than 3 days",
                "Severe mouth pain preventing eating/drinking",
                "Signs of secondary bacterial infection",
                "Difficulty breathing or swallowing",
            ],
            prevention: [
                "Frequent handwashing, especially after diaper changes",
                "Disinfect surfaces and toys regularly",
                "Avoid sharing utensils, cups, or personal items",
                "Stay home when sick",
            ],
            urgencyLevel: "medium",
            estimatedRecovery: "7-10 days",
            contagiousPeriod: "Most contagious during first week of illness",
        },
        Measles: {
            condition: "Measles (Rubeola)",
            severity: "High",
            description:
                "A highly contagious viral disease that can lead to serious complications. Requires immediate medical attention.",
            immediateActions: [
                "SEEK IMMEDIATE MEDICAL ATTENTION",
                "Isolate immediately to prevent spread",
                "Rest in a darkened room (light sensitivity is common)",
                "Increase fluid intake to prevent dehydration",
            ],
            medications: [
                "Vitamin A supplementation (as prescribed by doctor)",
                "Fever reducers as directed by healthcare provider",
                "Antibiotics only if secondary bacterial infection occurs",
                "Possible antiviral treatment in severe cases",
            ],
            whenToSeekHelp: [
                "IMMEDIATE medical attention required",
                "This is a reportable disease to health authorities",
                "Emergency care if difficulty breathing",
                "Any signs of complications (pneumonia, encephalitis)",
            ],
            prevention: [
                "MMR vaccination is highly effective",
                "Avoid contact with infected individuals",
                "Boost immunity through proper nutrition",
            ],
            urgencyLevel: "high",
            estimatedRecovery: "10-14 days with medical supervision",
            contagiousPeriod: "4 days before to 4 days after rash appears",
        },
        Monkeypox: {
            condition: "Monkeypox",
            severity: "High",
            description: "A viral infection that requires immediate medical attention and public health notification.",
            immediateActions: [
                "SEEK IMMEDIATE MEDICAL ATTENTION",
                "Isolate completely until all lesions heal",
                "Cover lesions when around others (if isolation not possible)",
                "Do not share personal items, clothing, or bedding",
            ],
            medications: [
                "Antiviral medications may be prescribed (tecovirimat)",
                "Pain management as directed by healthcare provider",
                "Antibiotics only for secondary bacterial infections",
                "Possible vaccination for close contacts",
            ],
            whenToSeekHelp: [
                "IMMEDIATE medical attention required",
                "Contact local health department",
                "This is a reportable disease",
                "Emergency care for severe symptoms",
            ],
            prevention: [
                "Avoid contact with infected animals or people",
                "Practice safe behaviors",
                "Vaccination available for high-risk individuals",
                "Proper hand hygiene",
            ],
            urgencyLevel: "high",
            estimatedRecovery: "2-4 weeks with medical supervision",
            contagiousPeriod: "Until all lesions heal completely",
        },
    }

    useEffect(() => {
        // Animate the result card when component mounts
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start()

        // Show recommendations after a delay
        setTimeout(() => {
            setShowRecommendations(true)
            Animated.timing(recommendationAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }).start()
        }, 1500)
    }, [])

    // Typewriter effect for recommendations
    useEffect(() => {
        if (showRecommendations && prediction && recommendationsDatabase[prediction]) {
            const recommendations = recommendationsDatabase[prediction]
            const fullText = `AI Analysis Complete: Based on the detected ${recommendations.condition}, here are personalized recommendations generated specifically for your case...`

            let index = 0
            const timer = setInterval(() => {
                setTypingText(fullText.slice(0, index))
                index++
                if (index > fullText.length) {
                    clearInterval(timer)
                }
            }, 30)

            return () => clearInterval(timer)
        }
    }, [showRecommendations, prediction])

    const getUrgencyColor = (urgencyLevel) => {
        switch (urgencyLevel) {
            case "high":
                return "#FF4040"
            case "medium":
                return "#FFA500"
            case "low":
                return "#4CAF50"
            case "none":
                return "#2196F3"
            default:
                return theme.text
        }
    }

    const getUrgencyIcon = (urgencyLevel) => {
        switch (urgencyLevel) {
            case "high":
                return "alert-circle"
            case "medium":
                return "warning"
            case "low":
                return "information-circle"
            case "none":
                return "checkmark-circle"
            default:
                return "help-circle"
        }
    }

    const renderConfidenceIndicator = () => {
        const segments = 5
        const filledSegments = Math.round((confidence / 100) * segments)

        return (
            <View style={styles.confidenceIndicator}>
                {[...Array(segments)].map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.confidenceSegment,
                            {
                                backgroundColor: index < filledSegments ? getConfidenceColor(confidence) : theme.border,
                            },
                        ]}
                    />
                ))}
            </View>
        )
    }

    const getConfidenceColor = (value) => {
        if (value >= 90) return "#4CAF50"
        if (value >= 70) return "#8BC34A"
        if (value >= 50) return "#FFC107"
        if (value >= 30) return "#FF9800"
        return "#F44336"
    }

    const renderRecommendationSection = (title, items, icon, color) => {
        return (
            <View style={[styles.recommendationSection, { borderLeftColor: color }]}>
                <View style={styles.recommendationHeader}>
                    <Icon name={icon} size={20} color={color} />
                    <Text style={[styles.recommendationTitle, { color: theme.text }]}>{title}</Text>
                </View>
                {items.map((item, index) => (
                    <Animated.View
                        key={index}
                        style={[
                            styles.recommendationItem,
                            {
                                opacity: recommendationAnim,
                                transform: [
                                    {
                                        translateX: recommendationAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={[styles.bulletPoint, { backgroundColor: color }]} />
                        <Text style={[styles.recommendationText, { color: theme.text }]}>{item}</Text>
                    </Animated.View>
                ))}
            </View>
        )
    }

    const currentRecommendation = recommendationsDatabase[prediction]

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.surface }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Icon name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>AI Analysis Report</Text>
                <View style={styles.headerRight}>
                    <Icon
                        name={isSaved ? "checkmark-circle" : "alert-circle"}
                        size={20}
                        color={isSaved ? "#4CAF50" : "#FF9800"}
                    />
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Save Status Banner */}
                <View style={[styles.saveStatusBanner, { backgroundColor: isSaved ? "#4CAF50" : "#FF9800" }]}>
                    <Icon name={isSaved ? "cloud-done" : "cloud-offline"} size={16} color="white" />
                    <Text style={styles.saveStatusText}>
                        {saveMessage || (isSaved ? "Results saved successfully" : "Results not saved")}
                    </Text>
                </View>

                <Animated.View
                    style={[
                        styles.resultCard,
                        {
                            backgroundColor: theme.surface,
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }],
                        },
                    ]}
                >
                    <View
                        style={[styles.resultHeader, { backgroundColor: getUrgencyColor(currentRecommendation?.urgencyLevel) }]}
                    >
                        <Icon name="medical" size={24} color="white" style={styles.headerIcon} />
                        <Text style={styles.resultHeaderText}>Diagnosis Complete</Text>
                    </View>

                    <View style={styles.resultContent}>
                        <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>Detected Condition</Text>
                        <Text style={[styles.resultValue, { color: theme.text }]}>{prediction}</Text>

                        <Text style={[styles.resultLabel, { color: theme.textSecondary, marginTop: 20 }]}>AI Confidence Level</Text>
                        <Text style={[styles.confidenceValue, { color: getConfidenceColor(confidence) }]}>
                            {confidence.toFixed(2)}%
                        </Text>

                        {renderConfidenceIndicator()}

                        {currentRecommendation && (
                            <View style={styles.quickInfoContainer}>
                                <View
                                    style={[
                                        styles.quickInfoItem,
                                        { backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" },
                                    ]}
                                >
                                    <Icon name="time-outline" size={16} color={theme.textSecondary} />
                                    <Text style={[styles.quickInfoText, { color: theme.textSecondary }]}>
                                        Recovery: {currentRecommendation.estimatedRecovery}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.quickInfoItem,
                                        { backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" },
                                    ]}
                                >
                                    <Icon
                                        name={getUrgencyIcon(currentRecommendation.urgencyLevel)}
                                        size={16}
                                        color={getUrgencyColor(currentRecommendation.urgencyLevel)}
                                    />
                                    <Text style={[styles.quickInfoText, { color: theme.textSecondary }]}>
                                        {currentRecommendation.severity} Priority
                                    </Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.divider} />

                        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                            This is an AI-assisted diagnosis and should not replace professional medical advice.
                        </Text>
                    </View>
                </Animated.View>

                {/* AI Recommendations Section */}
                {showRecommendations && currentRecommendation && (
                    <Animated.View
                        style={[
                            styles.recommendationsContainer,
                            {
                                backgroundColor: theme.surface,
                                opacity: recommendationAnim,
                                transform: [
                                    {
                                        translateY: recommendationAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.aiHeader}>
                            <Icon name="brain" size={24} color={theme.primary} />
                            <Text style={[styles.aiHeaderText, { color: theme.text }]}>AI-Generated Recommendations</Text>
                        </View>

                        <Text style={[styles.typingText, { color: theme.textSecondary }]}>{typingText}</Text>

                        <View
                            style={[
                                styles.conditionOverview,
                                { backgroundColor: theme.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)" },
                            ]}
                        >
                            <Text style={[styles.conditionTitle, { color: theme.text }]}>
                                About {currentRecommendation.condition}
                            </Text>
                            <Text style={[styles.conditionDescription, { color: theme.textSecondary }]}>
                                {currentRecommendation.description}
                            </Text>
                        </View>

                        {renderRecommendationSection(
                            "Immediate Actions",
                            currentRecommendation.immediateActions,
                            "flash",
                            "#FF6B6B",
                        )}

                        {renderRecommendationSection(
                            "Recommended Medications",
                            currentRecommendation.medications,
                            "medical",
                            "#4ECDC4",
                        )}

                        {renderRecommendationSection(
                            "When to Seek Medical Help",
                            currentRecommendation.whenToSeekHelp,
                            "warning",
                            "#FFE66D",
                        )}

                        {renderRecommendationSection(
                            "Prevention Tips",
                            currentRecommendation.prevention,
                            "shield-checkmark",
                            "#95E1D3",
                        )}

                        <View
                            style={[
                                styles.importantNote,
                                { backgroundColor: getUrgencyColor(currentRecommendation.urgencyLevel) + "20" },
                            ]}
                        >
                            <Icon
                                name={getUrgencyIcon(currentRecommendation.urgencyLevel)}
                                size={20}
                                color={getUrgencyColor(currentRecommendation.urgencyLevel)}
                            />
                            <Text style={[styles.importantNoteText, { color: theme.text }]}>
                                Contagious Period: {currentRecommendation.contagiousPeriod}
                            </Text>
                        </View>
                    </Animated.View>
                )}

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.surface }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Icon name="scan-outline" size={20} color={theme.primary} style={styles.buttonIcon} />
                        <Text style={[styles.buttonText, { color: theme.primary }]}>New Scan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate("Home")}
                    >
                        <Icon name="home-outline" size={20} color={theme.buttonText} style={styles.buttonIcon} />
                        <Text style={[styles.buttonText, { color: theme.buttonText }]}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingVertical: 16,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        marginTop: 24, // Increased margin top
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "bold",
    },
    backButton: {
        padding: 8,
    },
    headerRight: {
        width: 40,
        alignItems: "flex-end",
    },
    saveStatusBanner: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 8,
    },
    saveStatusText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
        marginLeft: 6,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
        paddingTop: 0,
    },
    resultCard: {
        borderRadius: 16,
        overflow: "hidden",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        marginBottom: 20,
    },
    resultHeader: {
        padding: 16,
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
    },
    headerIcon: {
        marginRight: 8,
    },
    resultHeaderText: {
        color: "white",
        fontSize: 16,
        fontWeight: "bold",
    },
    resultContent: {
        padding: 20,
        alignItems: "center",
    },
    resultLabel: {
        fontSize: 14,
        marginBottom: 5,
    },
    resultValue: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
    },
    confidenceValue: {
        fontSize: 24,
        fontWeight: "bold",
        marginBottom: 10,
    },
    confidenceIndicator: {
        flexDirection: "row",
        marginTop: 10,
        marginBottom: 20,
    },
    confidenceSegment: {
        width: 30,
        height: 8,
        marginHorizontal: 3,
        borderRadius: 4,
    },
    quickInfoContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        width: "100%",
        marginTop: 15,
    },
    quickInfoItem: {
        flexDirection: "row",
        alignItems: "center",
        padding: 8,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
        justifyContent: "center",
    },
    quickInfoText: {
        fontSize: 12,
        marginLeft: 4,
    },
    divider: {
        height: 1,
        width: "100%",
        backgroundColor: "rgba(0,0,0,0.1)",
        marginVertical: 20,
    },
    noteText: {
        fontSize: 12,
        fontStyle: "italic",
        textAlign: "center",
    },
    recommendationsContainer: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 20,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    aiHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 15,
    },
    aiHeaderText: {
        fontSize: 18,
        fontWeight: "bold",
        marginLeft: 10,
    },
    typingText: {
        fontSize: 14,
        fontStyle: "italic",
        marginBottom: 20,
        lineHeight: 20,
    },
    conditionOverview: {
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
    },
    conditionTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 8,
    },
    conditionDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    recommendationSection: {
        marginBottom: 20,
        borderLeftWidth: 4,
        paddingLeft: 15,
    },
    recommendationHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    recommendationTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginLeft: 8,
    },
    recommendationItem: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    bulletPoint: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 7,
        marginRight: 10,
    },
    recommendationText: {
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    importantNote: {
        flexDirection: "row",
        alignItems: "center",
        padding: 15,
        borderRadius: 12,
        marginTop: 10,
    },
    importantNoteText: {
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 10,
        flex: 1,
    },
    actionsContainer: {
        marginTop: 20,
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    buttonIcon: {
        marginRight: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "600",
    },
})

export default ResultScreen
